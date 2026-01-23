
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'VIEWER' },
            include: {
                transactions: {
                    where: {
                        type: 'TOPUP',
                        status: { in: ['APPROVED_1', 'APPROVED_2'] }
                    }
                }
            }
        })

        const updates = []
        for (const user of users) {
            // Calculate Total Deposit
            const totalDeposit = user.transactions.reduce((sum, t) => sum + t.amount_money, 0)

            // Calculate Expected LP
            const expectedLP = Math.floor(totalDeposit / 200000)

            // Only update if they have less than expected (don't reduce points if they have bonus)
            if (expectedLP > user.loyalty_points) {
                const diff = expectedLP - user.loyalty_points

                // Update
                const updatePromise = prisma.$transaction([
                    prisma.user.update({
                        where: { id: user.id },
                        data: { loyalty_points: expectedLP } // Sync to correct value
                    }),
                    prisma.loyaltyLog.create({
                        data: {
                            user_id: user.id,
                            amount: diff,
                            source: 'ADJUSTMENT',
                            description: `Backfill LP from Total Deposit Rp ${totalDeposit.toLocaleString()}`
                        }
                    })
                ])
                updates.push({ username: user.username, old: user.loyalty_points, new: expectedLP, diff })
                await updatePromise
            }
        }

        return NextResponse.json({
            message: 'Backfill completed',
            updatedCount: updates.length,
            details: updates
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
