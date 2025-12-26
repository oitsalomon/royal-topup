import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const userId = Number(request.headers.get('X-User-Id') || '1')

        const {
            type, // TOPUP | WITHDRAW
            user_wa,
            nickname,
            game_id,
            user_game_id,
            amount_chip,
            amount_money,
            payment_method_id,
            note
        } = body

        // Start Transaction
        const transaction = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction (Status: APPROVED_2 => COMPLETED)
            // Manual transactions are considered already done elsewhere
            const t = await tx.transaction.create({
                data: {
                    user_wa,
                    nickname,
                    game_id,
                    user_game_id,
                    amount_chip: Number(amount_chip) / 1000, // DB stores in B
                    amount_money: Number(amount_money),
                    payment_method_id,
                    type,
                    status: 'APPROVED_2', // Completed
                    processed_by_id: userId,
                    proof_image: 'MANUAL_ENTRY' // Flag
                }
            })

            // 2. Adjust Balance
            if (type === 'TOPUP') {
                // User bought chips. Money In, Chips Out.
                // Bank Balance +
                await tx.paymentMethod.update({
                    where: { id: payment_method_id },
                    data: { balance: { increment: amount_money } }
                })

                // We don't necessarily deduct GameAccount for manual unless we ask for it.
                // But usually "Manual" means we just want to record the money.
                // However, if we want accurate stock tracking, we should.
                // But the form does NOT ask for "Source Game Account".
                // So we will SKIP GameAccount deduction for Manual TopUp to avoid complexity?
                // OR we should assume it comes from "somewhere".
                // Let's leave Chip Balance untouched for Manual for now to avoid errors, 
                // OR strictly speaking we should deduct it if we knew where from.
                // For now: Only Money update.
            } else {
                // Withdraw. Chip In, Money Out.
                // Bank Balance -
                await tx.paymentMethod.update({
                    where: { id: payment_method_id },
                    data: { balance: { decrement: amount_money } }
                })
            }

            // 3. Log Activity
            await tx.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'MANUAL_TX',
                    details: `Manual ${type} #${t.id} - ${nickname} - Rp ${amount_money}`,
                    ip_address: '127.0.0.1' // or request.headers.get('x-forwarded-for')
                }
            })

            return t
        })

        return NextResponse.json(transaction)

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create manual transaction' }, { status: 500 })
    }
}
