import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetWeeklyReferralStats } from '@/services/referral'

export const dynamic = 'force-dynamic'

/**
 * Weekly Reset Cron
 * Intended to run every Monday at 00:00.
 */
export async function GET(request: Request) {
    try {
        console.log('[CRON] Starting weekly reset...')

        // Check for Vercel Cron Secret (Security)
        const authHeader = request.headers.get('authorization')
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Reset Referral Weekly Stats
        await resetWeeklyReferralStats()

        // 2. Reset Member Weekly Turnover (if exists in WeeklyStats model)
        // Note: WeeklyStats model has week_start unique constraint, 
        // usually we just create a new record for the new week rather than deleting.
        // But some systems might want to clear "current_week" flags.

        console.log('[CRON] Weekly Reset Complete.')

        // Log this action
        await prisma.activityLog.create({
            data: {
                user_id: 1, // System
                action: 'SYSTEM_WEEKLY_RESET',
                details: 'Reset weekly_personal_topup_B and wd_bonus_this_week for all users.',
                ip_address: 'System Cron'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Weekly reset completed successfully.'
        })

    } catch (error: any) {
        console.error('[CRON] Weekly Reset Failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
