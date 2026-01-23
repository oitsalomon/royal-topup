import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : null
}

// Admin only check
const isAdmin = async (userId: number) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
}

export async function POST(request: Request) {
    try {
        const userId = getUserId(request)
        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action, period, winnersCount } = body
        // action: 'DRAW'
        // period: '2023-10'
        // winnersCount: 10

        if (action === 'DRAW') {
            const count = winnersCount || 10

            // 1. Get all eligible tickets for period
            const tickets = await prisma.lotteryTicket.findMany({
                where: {
                    period: period,
                    is_winner: false
                }
            })

            if (tickets.length < count) {
                return NextResponse.json({ error: 'Not enough tickets to draw' }, { status: 400 })
            }

            // 2. Random Selection
            // Fisher-Yates shuffle or similar
            const shuffled = tickets.sort(() => 0.5 - Math.random())
            const winners = shuffled.slice(0, count)
            const winnerIds = winners.map(t => t.id)

            // 3. Update Winners
            await prisma.lotteryTicket.updateMany({
                where: { id: { in: winnerIds } },
                data: {
                    is_winner: true,
                    prize_desc: '100M Chip Reward'
                }
            })

            // 4. Return results (Admin will publish manually? Or auto-notify?)
            // For now just return the winners
            const winningTickets = await prisma.lotteryTicket.findMany({
                where: { id: { in: winnerIds } },
                include: { user: { select: { username: true, id: true } } }
            })

            return NextResponse.json({ success: true, winners: winningTickets })
        }

        // Action: GET_STATS
        if (action === 'STATS') {
            if (!period) return NextResponse.json({ error: 'Period required for stats' }, { status: 400 })

            const totalTickets = await prisma.lotteryTicket.count({
                where: { period }
            })

            const grouped = await prisma.lotteryTicket.groupBy({
                by: ['user_id'],
                where: { period },
                _count: { id: true }
            })

            // Top Players
            const participantCounts = await prisma.lotteryTicket.groupBy({
                by: ['user_id'],
                where: { period },
                _count: { id: true },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 10
            })

            const userIds = participantCounts.map(p => p.user_id)
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true }
            })

            const topPlayers = participantCounts.map(p => {
                const user = users.find(u => u.id === p.user_id)
                return {
                    username: user?.username || 'Unknown',
                    // @ts-ignore
                    count: p._count.id
                }
            })

            return NextResponse.json({
                totalTickets,
                totalParticipants: grouped.length, // Total unique users
                topPlayers
            })
        }

        // Action: RECENT_ACTIVITY (For Admin Monitoring)
        if (action === 'RECENT_ACTIVITY') {
            // Get last 5 tickets
            const recent = await prisma.lotteryTicket.findMany({
                where: { period },
                take: 5,
                orderBy: { createdAt: 'desc' }, // sending latest first
                include: {
                    user: { select: { username: true } }
                }
            })

            return NextResponse.json({ recent })
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
