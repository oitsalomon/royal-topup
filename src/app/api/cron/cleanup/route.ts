import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        console.log('[CRON] Starting monthly cleanup...')

        // Check for Vercel Cron Secret (Security)
        const authHeader = request.headers.get('authorization')
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Delete Old Activity Logs (> 90 Days)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const deletedLogs = await prisma.activityLog.deleteMany({
            where: {
                createdAt: {
                    lt: ninetyDaysAgo
                }
            }
        })

        // 2. Delete Old Transactions (> 180 Days) & Non-Pending
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const deletedTx = await prisma.transaction.deleteMany({
            where: {
                createdAt: {
                    lt: sixMonthsAgo
                },
                status: {
                    in: ['APPROVED_2', 'DECLINED']
                }
            }
        })

        // 3. Reset User Monthly Stats (Optional Logic - can be expanded)
        // For now, we just log that cleanup happened

        console.log(`[CRON] Cleanup Complete. Logs: ${deletedLogs.count}, Tx: ${deletedTx.count}`)

        // Log this cleanup action itself (so we know it ran)
        await prisma.activityLog.create({
            data: {
                user_id: 1, // System
                action: 'SYSTEM_CLEANUP',
                details: `Auto Cleanup: Deleted ${deletedLogs.count} Logs, ${deletedTx.count} Old Transactions`,
                ip_address: 'System Cron'
            }
        })

        return NextResponse.json({
            success: true,
            deleted_logs: deletedLogs.count,
            deleted_transactions: deletedTx.count
        })

    } catch (error: any) {
        console.error('[CRON] Cleanup Failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
