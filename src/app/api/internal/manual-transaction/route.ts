import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser, getClientIp } from '@/lib/session-helper'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const admin = await resolveAdminUser(request)
        const clientIp = getClientIp(request)

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
        const finalGameId = Number(game_id) || 1
        const finalBankId = payment_method_id ? Number(payment_method_id) : null

        const customTrxId = `MANUAL-${type === 'TOPUP' ? 'TP' : 'WD'}-${Date.now().toString().slice(-6)}`

        let bankInfo = ''
        if (finalBankId) {
            const b = await prisma.paymentMethod.findUnique({ where: { id: finalBankId }, select: { name: true, account_number: true } })
            if (b) bankInfo = ` (${b.name} ${b.account_number})`
        }

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
                    work_session_id: admin.work_session_id,
                    type,
                    status: 'APPROVED_2', // Completed
                    processed_by_id: admin.id,
                    proof_image: 'MANUAL_ENTRY', // Flag manual
                    sender_name: note ? `INPUT MANUAL: ${note}` : 'INPUT MANUAL',
                    target_payment_details: type === 'WITHDRAW' ? (note ? `Manual WD (${note})` : 'Input Manual') : null
                }
            })

            // 2. Adjust Bank & Game Account (Chip) Balance
            let targetGameAcc = await tx.gameAccount.findFirst({
                where: { game_id: finalGameId, isActive: true },
                orderBy: { balance: 'desc' }
            })
            if (!targetGameAcc) {
                targetGameAcc = await tx.gameAccount.findFirst({
                    where: { isActive: true },
                    orderBy: { balance: 'desc' }
                })
            }

            if (type === 'TOPUP') {
                // Top Up: Saldo Bank Toko Bertambah, Stok Chip Toko Berkurang
                if (finalBankId) {
                    await tx.paymentMethod.update({
                        where: { id: finalBankId },
                        data: { balance: { increment: finalMoney } }
                    })
                }
                if (targetGameAcc) {
                    await tx.gameAccount.update({
                        where: { id: targetGameAcc.id },
                        data: { balance: { decrement: finalChipB } }
                    })
                }
            } else {
                // Withdraw: Saldo Bank Toko Berkurang, Stok Chip Toko Bertambah
                if (finalBankId) {
                    await tx.paymentMethod.update({
                        where: { id: finalBankId },
                        data: { balance: { decrement: finalMoney } }
                    })
                }
                if (targetGameAcc) {
                    await tx.gameAccount.update({
                        where: { id: targetGameAcc.id },
                        data: { balance: { increment: finalChipB } }
                    })
                }
            }

            // 3. Log Activity
            await tx.activityLog.create({
                data: {
                    user_id: admin.id,
                    work_session_id: admin.work_session_id,
                    action: 'MANUAL_TX',
                    details: `Manual ${type} #${t.id} (${customTrxId}) - ${nickname} (ID: ${user_game_id || '-'}) - ${finalChipB}B - Rp ${finalMoney.toLocaleString('id-ID')}${bankInfo}${note ? ' - Ket: ' + note : ''}`,
                    ip_address: clientIp
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
