import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : null
}

const REWARDS = {
    TICKET_1: { type: 'TICKET', cost: 5, value: 1 },
    TICKET_6: { type: 'TICKET', cost: 25, value: 6 },
    TICKET_15: { type: 'TICKET', cost: 50, value: 15 },

    // Vouchers
    VOUCHER_WD_1: { type: 'VOUCHER', cost: 40, quota: 1, name: 'Voucher Potong Admin WD (1x)' },
    VOUCHER_WD_3: { type: 'VOUCHER', cost: 110, quota: 3, name: 'Paket Voucher Potong Admin WD (3x)' },

    // Banners
    BANNER_SILVER: { type: 'BANNER', cost: 30, id: 'BANNER_SILVER', name: 'Silver Banner' },
    BANNER_GOLD: { type: 'BANNER', cost: 80, id: 'BANNER_GOLD', name: 'Gold Banner' },
    BANNER_DIAMOND: { type: 'BANNER', cost: 150, id: 'BANNER_DIAMOND', name: 'Diamond Banner' },
}

export async function POST(request: Request) {
    try {
        const userId = getUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { rewardKey, period } = body // e.g., 'TICKET_1', period required for tickets

        const reward = REWARDS[rewardKey as keyof typeof REWARDS]
        if (!reward) {
            return NextResponse.json({ error: 'Invalid Reward' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (user.loyalty_points < reward.cost) {
            return NextResponse.json({ error: 'Insufficient Loyalty Points' }, { status: 400 })
        }

        // Additional Checks
        if (reward.type === 'VOUCHER') {
            // Rule: Max 1 voucher per week? 
            // "Max 1 voucher per minggu"
            // We need to check creation time of last voucher?
            // For now, let's just stick to checking if they have one active? 
            // Or strictly implement "Max 1 purchase per week".

            // Check last purchased voucher
            const lastVoucher = await prisma.userVoucher.findFirst({
                where: { user_id: userId, type: 'WD_ADMIN_CUT' },
                orderBy: { createdAt: 'desc' }
            })

            if (lastVoucher) {
                const now = new Date()
                const oneWeekVal = 7 * 24 * 60 * 60 * 1000
                const diff = now.getTime() - lastVoucher.createdAt.getTime()
                if (diff < oneWeekVal) {
                    return NextResponse.json({ error: 'Max 1 voucher purchase per week' }, { status: 400 })
                }
            }
        }

        if (reward.type === 'BANNER') {
            // @ts-ignore
            if (user.owned_banners.includes(reward.id)) {
                return NextResponse.json({ error: 'You already own this banner' }, { status: 400 })
            }
        }

        // Execute Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Deduct Points
            await tx.user.update({
                where: { id: userId },
                data: { loyalty_points: { decrement: reward.cost } }
            })

            // Log History
            await tx.loyaltyLog.create({
                data: {
                    user_id: userId,
                    amount: -reward.cost,
                    source: `REDEEM_${reward.type}`,
                    description: `Redeemed ${rewardKey}`
                }
            })

            // Grant Item
            if (reward.type === 'TICKET') {
                // @ts-ignore
                const count = reward.value || 1
                // Create tickets
                for (let i = 0; i < count; i++) {
                    const code = `TCK-${Date.now()}-${userId}-${Math.floor(Math.random() * 1000)}`
                    await tx.lotteryTicket.create({
                        data: {
                            user_id: userId,
                            period: period || 'GENERAL',
                            ticket_code: code
                        }
                    })
                }
            } else if (reward.type === 'VOUCHER') {
                await tx.userVoucher.create({
                    data: {
                        user_id: userId,
                        type: 'WD_ADMIN_CUT',
                        // @ts-ignore
                        quota: reward.quota || 1
                    }
                })
            } else if (reward.type === 'BANNER') {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        // @ts-ignore
                        owned_banners: { push: reward.id }
                    }
                })
            }

            return { success: true, reward: rewardKey }
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
