import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('id')

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // 1. Get Week Start
        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const weekStart = new Date(now.setDate(diff))
        weekStart.setHours(0, 0, 0, 0)

        // 2. Fetch User & Stats & Referrals in Parallel
        const id = Number(userId)

        const [user, referralStats, totalReferralVolume] = await Promise.all([
            // Query 1: User Data
            prisma.user.findUnique({
                where: { id },
                include: {
                    weeklyStats: {
                        where: { week_start: weekStart }
                    },
                    gameIds: {
                        include: { game: true }
                    }
                }
            }),

            // Query 2: Referral Count
            (prisma as any).user.aggregate({
                where: { referrer_id: id },
                _count: { id: true }
            }),

            // Query 3: Referral Volume
            (prisma as any).transaction.aggregate({
                where: {
                    user: { referrer_id: id },
                    status: 'APPROVED_2',
                    type: 'TOPUP'
                },
                _sum: { amount_chip: true }
            })
        ])

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Safe cast for user to access potentially un-typed fields
        const safeUser = user as any
        const stats = safeUser.weeklyStats[0] || {
            week_start: weekStart,
            total_turnover: 0,
            eligible_turnover: 0,
            cashback_earned: 0,
            is_claimed: false
        }

        // 3. Calculate Progress to Next Level
        // Bronze -> Silver (30B)
        // Silver -> Gold (80B)
        // Gold -> Diamond (200B)
        let nextLevelTarget = 0
        let nextLevelName = ''

        switch (user.level) {
            case 'BRONZE':
                nextLevelTarget = 30_000_000_000
                nextLevelName = 'SILVER'
                break
            case 'SILVER':
                nextLevelTarget = 80_000_000_000
                nextLevelName = 'GOLD'
                break
            case 'GOLD':
                nextLevelTarget = 200_000_000_000
                nextLevelName = 'DIAMOND'
                break
            default:
                nextLevelTarget = 0 // Max level
        }

        const progressPercent = nextLevelTarget > 0
            ? Math.min(100, (stats.total_turnover / nextLevelTarget) * 100)
            : 100

        return NextResponse.json({
            user: {
                username: safeUser.username,
                level: safeUser.level,
                total_exp: safeUser.total_exp,
                bank_name: safeUser.bank_name,
                account_number: safeUser.account_number,
                loyalty_points: safeUser.loyalty_points,
                referral_code: safeUser.referral_code,
                balance_bonus: safeUser.balance_bonus,
                weekly_personal_topup_B: safeUser.weekly_personal_topup_B,
                wd_bonus_this_week: safeUser.wd_bonus_this_week
            },
            stats,
            referralSummary: {
                totalReferrals: referralStats._count?.id || 0,
                totalVolumeB: totalReferralVolume._sum?.amount_chip || 0
            },
            levelProgress: {
                current: stats.total_turnover,
                target: nextLevelTarget,
                percent: progressPercent,
                nextLevel: nextLevelName
            },
            gameIds: safeUser.gameIds // Return full object for compatibility with AuthProvider
        })

    } catch (error) {
        console.error('Member stats error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
