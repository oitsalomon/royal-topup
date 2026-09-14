import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSessionFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const adminSession = await getAdminSessionFromRequest(request)
        const userId = adminSession ? Number(adminSession.id) : Number(request.headers.get('X-User-Id') || '1')

        const {
            type, // TOPUP | WITHDRAW
            user_wa,
            nickname,
            game_id,
            user_game_id,
            amount_chip,
            chip_unit = 'B', // 'B' | 'M'
            amount_money,
            payment_method_id,
            note
        } = body

        // Konversi amount_chip ke satuan Billion (B) - standar penyimpanan database
        const rawChip = Number(amount_chip) || 0
        const finalChipB = chip_unit === 'M' ? rawChip / 1000 : rawChip
        const finalMoney = Number(amount_money) || 0
        const finalGameId = Number(game_id)
        const finalBankId = payment_method_id ? Number(payment_method_id) : null

        const customTrxId = `MANUAL-${type === 'TOPUP' ? 'TP' : 'WD'}-${Date.now().toString().slice(-6)}`

        // Start Transaction
        const transaction = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction (Status: APPROVED_2 => COMPLETED)
            const t = await tx.transaction.create({
                data: {
                    trx_id: customTrxId,
                    user_wa: user_wa || '-',
                    nickname: nickname || 'Customer Manual',
                    game_id: finalGameId,
                    user_game_id: user_game_id || '-',
                    amount_chip: finalChipB,
                    amount_money: finalMoney,
                    payment_method_id: finalBankId,
                    withdraw_method_id: type === 'WITHDRAW' ? finalBankId : null,
                    type,
                    status: 'APPROVED_2', // Completed
                    processed_by_id: userId,
                    proof_image: 'MANUAL_ENTRY', // Flag manual
                    sender_name: note ? `INPUT MANUAL: ${note}` : 'INPUT MANUAL',
                    target_payment_details: type === 'WITHDRAW' ? (note ? `Manual WD (${note})` : 'Input Manual') : null
                }
            })

            // 2. Adjust Balance
            if (finalBankId) {
                if (type === 'TOPUP') {
                    await tx.paymentMethod.update({
                        where: { id: finalBankId },
                        data: { balance: { increment: finalMoney } }
                    })
                } else {
                    await tx.paymentMethod.update({
                        where: { id: finalBankId },
                        data: { balance: { decrement: finalMoney } }
                    })
                }
            }

            // 3. Log Activity
            await tx.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'MANUAL_TX',
                    details: `Manual ${type} #${t.id} (${customTrxId}) - ${nickname} - ${finalChipB}B - Rp ${finalMoney}`,
                    ip_address: '127.0.0.1'
                }
            })

            return t
        })

        return NextResponse.json(transaction)

    } catch (error) {
        console.error('Manual transaction error:', error)
        return NextResponse.json({ error: 'Gagal membuat transaksi manual' }, { status: 500 })
    }
}
