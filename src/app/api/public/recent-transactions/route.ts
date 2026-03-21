import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { status: 'SUCCESS' },
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                type: true,
                user_wa: true,
                nickname: true,
                amount_chip: true,
                amount_money: true,
                createdAt: true,
                updatedAt: true
            }
        })

        // Mask user_wa and format chip amount
        const recentReal = transactions.map(t => {
            const wa = t.user_wa || ''
            // e.g., 081234567890 -> 0812****7890
            let maskedName = t.nickname || ''
            
            if (wa.length > 8) {
                const prefix = wa.substring(0, 4)
                const suffix = wa.substring(wa.length - 3)
                maskedName = `${prefix}****${suffix}`
            } else if (maskedName.length > 4) {
                 maskedName = `${maskedName.substring(0, 3)}***`
            } else {
                 maskedName = 'Member***'
            }

            // Convert amount_chip to label
            // In DB, chip is stored in M. 1000 = 1B.
            let formattedAmount = ''
            if (t.type === 'TOPUP') {
                formattedAmount = t.amount_chip >= 1000 
                    ? `${t.amount_chip / 1000}B` 
                    : `${t.amount_chip}M`
            } else {
                // For BONGKAR, we display the money transferred
                formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.amount_money)
            }

            return {
                id: t.id,
                type: t.type,
                name: maskedName,
                amountStr: formattedAmount
            }
        })

        return NextResponse.json(recentReal)
    } catch (e) {
        console.error('Failed to fetch recent transactions', e)
        return NextResponse.json([])
    }
}
