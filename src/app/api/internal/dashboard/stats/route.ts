import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // 1. Fetch Banks
        const banks = await prisma.paymentMethod.findMany({
            where: { type: 'BANK', isActive: true },
            orderBy: { name: 'asc' }
        })

        // 2. Fetch Game Accounts
        const gameAccounts = await prisma.gameAccount.findMany({
            where: { isActive: true },
            include: { game: true },
            orderBy: { game: { name: 'asc' } }
        })

        // 3. Pending Transactions Count
        const pendingCount = await prisma.transaction.count({
            where: { status: 'PENDING' }
        })

        // 4. Daily Stats (Today)
        const dailyTransactions = await prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: today
                },
                status: {
                    in: ['APPROVED_1', 'APPROVED_2'] // Only count successful ones? Or all? Usually successful.
                }
            }
        })

        const stats = {
            topup: {
                count: 0,
                money_in: 0,
                chip_out: 0
            },
            withdraw: {
                count: 0,
                money_out: 0,
                chip_in: 0
            }
        }

        dailyTransactions.forEach(tx => {
            if (tx.type === 'TOPUP') {
                stats.topup.count++
                stats.topup.money_in += tx.amount_money
                stats.topup.chip_out += tx.amount_chip
            } else if (tx.type === 'WITHDRAW') {
                stats.withdraw.count++
                stats.withdraw.money_out += tx.amount_money
                stats.withdraw.chip_in += tx.amount_chip
            }
        })

        return NextResponse.json({
            banks,
            gameAccounts,
            pendingCount,
            dailyStats: stats
        })

    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
