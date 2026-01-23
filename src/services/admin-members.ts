import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function getMembers(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    level: string = ''
) {
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
        role: 'VIEWER', // Only fetch regular members, not admins
        OR: search ? [
            { username: { contains: search, mode: 'insensitive' } },
            { bank_name: { contains: search, mode: 'insensitive' } },
            { account_name: { contains: search, mode: 'insensitive' } },
            { account_number: { contains: search, mode: 'insensitive' } },
            { whatsapp: { contains: search, mode: 'insensitive' } }, // Verified: WhatsApp search added
        ] : undefined,
    }

    if (level) {
        where.level = level as any
    }

    const [members, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                weeklyStats: {
                    orderBy: { week_start: 'desc' },
                    take: 1
                },
                _count: {
                    select: { gameIds: true }
                }
            }
        }),
        prisma.user.count({ where })
    ])

    // Aggregate Transactions for these members
    const memberIds = members.map(m => m.id)
    const transactionStats = await prisma.transaction.groupBy({
        by: ['user_id', 'type'],
        _sum: { amount_money: true },
        _max: { createdAt: true },
        where: {
            user_id: { in: memberIds },
            status: { in: ['APPROVED_1', 'APPROVED_2'] } // Only confirmed money moves
        }
    })

    // Map stats to members
    const membersWithStats = members.map(member => {
        const stats = transactionStats.filter(s => s.user_id === member.id)
        const totalTopUp = stats.find(s => s.type === 'TOPUP')?._sum.amount_money || 0
        const totalWithdraw = stats.find(s => s.type === 'WITHDRAW')?._sum.amount_money || 0

        // Calculate Last Activity (Max of Last Login vs Last Transaction)
        const lastTxDate = stats.reduce((max, s) => {
            if (!s._max.createdAt) return max
            return !max || s._max.createdAt > max ? s._max.createdAt : max
        }, null as Date | null)

        let lastActivity = member.lastLogin
        if (lastTxDate) {
            if (!lastActivity || lastTxDate > lastActivity) {
                lastActivity = lastTxDate
            }
        }

        return { ...member, totalTopUp, totalWithdraw, lastActivity }
    })

    // Calculate Stats
    // 1. Total Members
    const totalMembers = await prisma.user.count({ where: { role: 'VIEWER' } })

    // 2. Active Members (This Week)
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)) // Monday
    startOfWeek.setHours(0, 0, 0, 0)

    const activeMembersCount = await prisma.user.count({
        where: {
            role: 'VIEWER',
            lastLogin: { gte: startOfWeek }
        }
    })

    // 3. Active Members (Today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeMembersTodayCount = await prisma.user.count({
        where: {
            role: 'VIEWER',
            lastLogin: { gte: today }
        }
    })

    return {
        members: membersWithStats,
        pagination: {
            total,
            pages: Math.ceil(total / limit),
            current: page
        },
        stats: {
            totalMembers,
            activeMembers: activeMembersCount,
            activeMembersToday: activeMembersTodayCount
        }
    }
}

export async function getMemberDetail(id: number) {
    const member = await prisma.user.findUnique({
        where: { id },
        include: {
            gameIds: {
                include: { game: true }
            },
            weeklyStats: {
                orderBy: { week_start: 'desc' },
                take: 12 // Last 12 weeks
            }
        }
    })

    if (!member) return null

    // Aggregate lifetime stats
    // Note: total_turnover in user model isn't maintained, we rely on stats or live aggregation.
    // Let's stick to weekly stats for now or do a quick aggregate if needed.
    // The Schema has `total_turnover` on User? No, it has `level`, `total_exp`.
    // WeeklyStats has `total_turnover`.

    return member
}

export async function updateMember(id: number, data: any) {
    return prisma.user.update({
        where: { id },
        data
    })
}

// Special action: Reset Weekly Cashback
export async function resetMemberCashback(userId: number) {
    // Find latest weekly stat
    const latestStat = await prisma.weeklyStats.findFirst({
        where: { user_id: userId },
        orderBy: { week_start: 'desc' }
    })

    if (!latestStat) throw new Error("No weekly stats found")

    return prisma.weeklyStats.update({
        where: { id: latestStat.id },
        data: { cashback_earned: 0, is_claimed: true } // Mark as claimed/zeroed
    })
}

export async function updateUserGameId(rowId: number, newGameUserId: string, newGameId?: number) {
    const data: any = { game_user_id: newGameUserId }
    if (newGameId) data.game_id = newGameId

    return prisma.userGameId.update({
        where: { id: rowId },
        data
    })
}

export async function deleteUserGameId(rowId: number) {
    return prisma.userGameId.delete({
        where: { id: rowId }
    })
}

export async function addUserGameId(userId: number, gameId: number, gameUserId: string) {
    return prisma.userGameId.create({
        data: {
            user_id: userId,
            game_id: gameId,
            game_user_id: gameUserId
        }
    })
}
