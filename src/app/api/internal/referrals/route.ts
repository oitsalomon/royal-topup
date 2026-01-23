import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Fetch all users who have at least one referral
        const referrers = await (prisma as any).user.findMany({
            where: {
                referrals: {
                    some: {} // Has at least one downline
                }
            },
            select: {
                id: true,
                username: true,
                referral_code: true,
                balance_bonus: true,
                referrals: {
                    select: {
                        id: true,
                        username: true,
                        createdAt: true,
                    }
                }
            }
        })

        // For each downline, calculate their total TOPUP volume
        const result = await Promise.all(referrers.map(async (referrer: any) => {
            const downlinesWithStats = await Promise.all(referrer.referrals.map(async (dl: any) => {
                const totalVolume = await prisma.transaction.aggregate({
                    where: {
                        user_id: dl.id,
                        type: 'TOPUP',
                        status: 'APPROVED_2'
                    },
                    _sum: {
                        amount_chip: true
                    }
                })

                const totalBonusGenerated = await (prisma as any).referralBonusLog.aggregate({
                    where: {
                        referrer_id: referrer.id,
                        referred_user_id: dl.id,
                        status: 'SUCCESS'
                    },
                    _sum: {
                        bonus_amount: true
                    }
                })

                return {
                    id: dl.id,
                    username: dl.username,
                    joinedAt: dl.createdAt,
                    purchaseVolumeB: (totalVolume._sum.amount_chip || 0),
                    bonusGenerated: totalBonusGenerated._sum.bonus_amount || 0
                }
            }))

            return {
                id: referrer.id,
                username: referrer.username,
                referralCode: referrer.referral_code,
                totalBonusBalance: referrer.balance_bonus,
                downlineCount: referrer.referrals.length,
                downlines: downlinesWithStats
            }
        }))

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Failed to fetch admin referrals:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
