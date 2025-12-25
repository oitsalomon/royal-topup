import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [
            banks,
            gameAccounts,
            pendingCount,
            dailyStats,
            totalStats
        ] = await Promise.all([
            // 1. Fetch Banks (Usually few, so all is fine)
            prisma.paymentMethod.findMany({
                where: { type: 'BANK', isActive: true },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    account_number: true,
                    account_name: true,
                    balance: true,
                    type: true
                }
            }),

            // 2. Fetch Top 50 Game Accounts (Optimized)
            prisma.gameAccount.findMany({
                where: { isActive: true },
                take: 50,
                orderBy: { balance: 'desc' }, // Show richest first
                select: {
                    id: true,
                    username: true,
                    balance: true,
                    game: {
                        select: { id: true, name: true, code: true }
                    }
                }
            }),

            // 3. Pending Count
            prisma.transaction.count({
                where: { status: 'PENDING' }
            }),

            // 4. Daily Stats (Aggregated in DB)
            (async () => {
                const [topup, withdraw] = await Promise.all([
                    prisma.transaction.aggregate({
                        where: {
                            type: 'TOPUP',
                            createdAt: { gte: today },
                            status: { in: ['APPROVED_1', 'APPROVED_2'] }
                        },
                        _count: true,
                        _sum: { amount_money: true, amount_chip: true }
                    }),
                    prisma.transaction.aggregate({
                        where: {
                            type: 'WITHDRAW',
                            createdAt: { gte: today },
                            status: { in: ['APPROVED_1', 'APPROVED_2'] }
                        },
                        _count: true,
                        _sum: { amount_money: true, amount_chip: true }
                    })
                ])

                return {
                    topup: {
                        count: topup._count,
                        money_in: topup._sum.amount_money || 0,
                        chip_out: topup._sum.amount_chip || 0
                    },
                    withdraw: {
                        count: withdraw._count,
                        money_out: withdraw._sum.amount_money || 0,
                        chip_in: withdraw._sum.amount_chip || 0
                    }
                }
            })(),

            // 5. Total Chip Balance (Aggregated in DB for accuracy)
            prisma.gameAccount.aggregate({
                where: { isActive: true },
                _sum: { balance: true }
            })
        ])

        return NextResponse.json({
            banks,
            gameAccounts, // Now limit 50
            pendingCount,
            dailyStats,
            totalStats: {
                chipBalance: totalStats._sum.balance || 0
            }
        })

    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
