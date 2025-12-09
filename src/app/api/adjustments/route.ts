import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const adjustments = await prisma.adjustment.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(adjustments)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { user_id, amount, type, reason, bank_id, game_account_id } = body

        const result = await prisma.$transaction(async (tx) => {
            const adjustment = await tx.adjustment.create({
                data: {
                    user_id: Number(user_id),
                    amount: Number(amount),
                    type,
                    reason,
                    bank_id: bank_id ? Number(bank_id) : null,
                    game_account_id: game_account_id ? Number(game_account_id) : null
                }
            })

            // Update Balances
            if (bank_id) {
                // Adjust Bank Balance
                await tx.paymentMethod.update({
                    where: { id: Number(bank_id) },
                    data: { balance: { increment: Number(amount) } } // Amount can be negative
                })
            } else if (game_account_id) {
                // Adjust Game Account Balance
                await tx.gameAccount.update({
                    where: { id: Number(game_account_id) },
                    data: { balance: { increment: Number(amount) } }
                })
            } else {
                // Fallback: Adjust User Balance (Legacy/Personal)
                if (type === 'MONEY') {
                    await tx.user.update({
                        where: { id: Number(user_id) },
                        data: { balance_money: { increment: Number(amount) } }
                    })
                } else if (type === 'CHIP') {
                    await tx.user.update({
                        where: { id: Number(user_id) },
                        data: { balance_chip: { increment: Number(amount) } }
                    })
                }
            }

            // Log Activity
            await tx.activityLog.create({
                data: {
                    user_id: Number(user_id),
                    action: 'ADJUSTMENT',
                    details: `Adjustment ${type} ${amount} for ${bank_id ? 'Bank #' + bank_id : game_account_id ? 'GameAccount #' + game_account_id : 'User'}`,
                    ip_address: '127.0.0.1'
                }
            })

            return adjustment
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
    }
}
