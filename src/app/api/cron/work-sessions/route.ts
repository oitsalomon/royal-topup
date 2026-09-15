import { NextResponse } from 'next/server'
import { expireInactiveWorkSessions } from '@/lib/session-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Proteksi CRON_SECRET
        const authHeader = request.headers.get('authorization')
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const expiredCount = await expireInactiveWorkSessions()

        return NextResponse.json({
            success: true,
            message: `Work session auto-expiry complete. ${expiredCount} session(s) marked EXPIRED.`,
            expiredCount
        })
    } catch (error: any) {
        console.error('Cron work-sessions failed:', error)
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
    }
}
