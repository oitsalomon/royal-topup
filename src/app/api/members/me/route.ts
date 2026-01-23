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

        // 2. Fetch User & Stats
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            include: {
                weeklyStats: {
                    where: { week_start: weekStart }
                },
                gameIds: {
                    include: { game: true }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const stats = user.weeklyStats[0] || {
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

        // 4. Referral Stats Summary
        const referralStats = await prisma.user.aggregate({
            where: { referrer_id: user.id },
            _count: { id: true }
        })

        const totalReferralVolume = await prisma.transaction.aggregate({
            where: {
                user: { referrer_id: user.id },
                status: 'APPROVED_2',
                type: 'TOPUP'
            },
            _sum: { amount_chip: true }
        })

        return NextResponse.json({
            user: {
                username: user.username,
                level: user.level,
                total_exp: user.total_exp,
                bank_name: user.bank_name,
                account_number: user.account_number,
                loyalty_points: user.loyalty_points,
                referral_code: user.referral_code,
                balance_bonus: user.balance_bonus,
                weekly_personal_topup_B: user.weekly_personal_topup_B,
                wd_bonus_this_week: user.wd_bonus_this_week
            },
            stats,
            referralSummary: {
                totalReferrals: referralStats._count.id,
                totalVolumeB: totalReferralVolume._sum.amount_chip || 0
            },
            levelProgress: {
                current: stats.total_turnover,
                target: nextLevelTarget,
                percent: progressPercent,
                nextLevel: nextLevelName
            },
            gameIds: user.gameIds // Return full object for compatibility with AuthProvider
        })

    } catch (error) {
        console.error('Member stats error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
