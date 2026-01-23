
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const pendingCount = await prisma.transaction.count({
            where: {
                status: 'PENDING',
                type: { in: ['TOPUP', 'WITHDRAW'] }
            }
        })

        const referralPendingCount = await prisma.transaction.count({
            where: {
                status: 'PENDING',
                type: 'REFERRAL_WD'
            }
        })

        return NextResponse.json({
            pending: pendingCount,
            referral: referralPendingCount
        })
    } catch (error) {
        console.error('Notification check error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
