import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateMemberStats, awardLoyaltyPoints } from '@/services/member'
import { processReferralBonus, reverseReferralBonus } from '@/services/referral'
import { getAdminSessionFromRequest } from '@/lib/auth'
import { getActiveWorkSessionId, getClientIp } from '@/lib/session-helper'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { stage, action, game_account_id, bank_id } = body // stage: 1 or 2, action: APPROVE or DECLINE

        const adminSession = await getAdminSessionFromRequest(request)
        if (!adminSession) {
            return NextResponse.json({
                error: 'Unauthorized: Hanya admin terotentikasi yang berwenang menyetujui transaksi.'
            }, { status: 401 })
        }
        const userId = adminSession.id

        const transaction = await prisma.transaction.findUnique({
            where: { id: Number(id) }
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        // Stage checks: Support 1-Click DIRECT (stage === 'DIRECT' | 3 | 'ALL') and UNPAID status
        const isDirect = stage === 'DIRECT' || stage === 3 || stage === 'ALL'
        let isValidStatus = false

        if (action === 'APPROVE') {
            if (isDirect) {
                isValidStatus = transaction.status === 'PENDING' || transaction.status === 'UNPAID' || transaction.status === 'APPROVED_1'
            } else if (stage === 1) {
                isValidStatus = transaction.status === 'PENDING' || transaction.status === 'UNPAID'
            } else if (stage === 2) {
                isValidStatus = transaction.status === 'APPROVED_1'
            }
        } else {
            // For Decline: allow declining any unfinalized transaction
            isValidStatus = transaction.status !== 'DECLINED' && transaction.status !== 'APPROVED_2'
        }

        if (!isValidStatus) {
            return NextResponse.json({
                error: 'Status transaksi tidak valid untuk tindakan ini atau sudah diproses admin lain. Silakan muat ulang.',
                code: 'CONFLICT',
                currentStatus: transaction.status
            }, { status: 409 })
        }

        let newStatus = transaction.status

        if (action === 'DECLINE') {
            newStatus = 'DECLINED'
        } else if (action === 'APPROVE') {
            if (isDirect || stage === 2) {
                newStatus = 'APPROVED_2' // Completed
            } else if (stage === 1) {
                newStatus = 'APPROVED_1' // Halfway approved
            }
        }

        const workSessionId = await getActiveWorkSessionId(userId)
        const clientIp = getClientIp(request)

        const updated = await prisma.$transaction(async (tx: any) => {
            const t = await tx.transaction.update({
                where: { id: Number(id) },
                data: {
                    status: newStatus,
                    processed_by_id: userId,
                    work_session_id: workSessionId || undefined
                }
            })

            const chipDisplay = transaction.amount_chip < 1
                ? `${Math.round(transaction.amount_chip * 1000)}M`
                : `${Number(transaction.amount_chip.toFixed(2))}B`

            // Log Activity for both APPROVE and DECLINE
            await tx.activityLog.create({
                data: {
                    user_id: userId,
                    work_session_id: workSessionId || null,
                    action: action === 'APPROVE' ? 'APPROVE_TX' : 'DECLINE_TX',
                    details: `Transaction #${id} (TRX: ${transaction.trx_id || '-'}) ${transaction.type} Stage ${stage} ${action === 'APPROVE' ? 'Approved' : 'Declined'} | Rp ${transaction.amount_money.toLocaleString('id-ID')} | Chip: ${chipDisplay} by ${adminSession.username}`,
                    ip_address: clientIp
                }
            })

            if (action === 'DECLINE') {
                // If we are declining a transaction that was already completed (rare but possible in some UI flows),
                // we should reverse the bonuses.
                if (transaction.status === 'APPROVED_2') {
                    await reverseReferralBonus(transaction.id, tx)
                }

                // If it's a Referral WD, refund the bonus balance to the user
                if (transaction.type === 'REFERRAL_WD' && transaction.user_id) {
                    await tx.user.update({
                        where: { id: transaction.user_id },
                        data: {
                            balance_bonus: { increment: transaction.amount_money },
                            wd_bonus_this_week: false
                        }
                    })
                }
            }

            if (action === 'APPROVE') {
                if (transaction.type === 'TOPUP') {
                    // Money Received: Bank Balance + (jika stage === 1 atau isDirect)
                    if (stage === 1 || (isDirect && transaction.status !== 'APPROVED_1')) {
                        let targetBankId = bank_id ? Number(bank_id) : transaction.payment_method_id
                        if (!targetBankId) {
                            const fallbackBank = await tx.paymentMethod.findFirst({
                                where: { isActive: true },
                                orderBy: { id: 'asc' }
                            })
                            if (fallbackBank) targetBankId = fallbackBank.id
                        }
                        if (targetBankId) {
                            await tx.paymentMethod.update({
                                where: { id: targetBankId },
                                data: { balance: { increment: transaction.amount_money } }
                            })
                        }
                    }
                    // Chip Sent: Game Account Balance - (jika stage === 2 atau isDirect)
                    if (stage === 2 || isDirect) {
                        let targetAccId = game_account_id ? Number(game_account_id) : null
                        if (!targetAccId) {
                            const autoAcc = await tx.gameAccount.findFirst({
                                where: { game_id: transaction.game_id, isActive: true },
                                orderBy: { balance: 'desc' }
                            }) || await tx.gameAccount.findFirst({
                                where: { isActive: true },
                                orderBy: { balance: 'desc' }
                            })
                            if (autoAcc) targetAccId = autoAcc.id
                        }
                        if (targetAccId) {
                            await tx.gameAccount.update({
                                where: { id: targetAccId },
                                data: { balance: { decrement: transaction.amount_chip } }
                            })
                        }

                        // Update Member Stats (Turnover, EXP)
                        // ONLY if the transaction is linked to a user
                        // @ts-ignore
                        if (transaction.user_id) {
                            // @ts-ignore
                            await updateMemberStats(transaction.user_id, transaction.amount_chip, tx)

                            // Award Loyalty Points (based on Money spent)
                            // @ts-ignore
                            await awardLoyaltyPoints(transaction.user_id, transaction.amount_money, tx)

                            // Process Referral Bonus
                            await processReferralBonus(transaction.id, tx)
                        }
                    }
                } else if (transaction.type === 'WITHDRAW') {
                    // Chip Received: Game Account Balance + (jika stage === 1 atau isDirect)
                    if (stage === 1 || (isDirect && transaction.status !== 'APPROVED_1')) {
                        let targetAccId = game_account_id ? Number(game_account_id) : null
                        if (!targetAccId) {
                            const autoAcc = await tx.gameAccount.findFirst({
                                where: { game_id: transaction.game_id, isActive: true },
                                orderBy: { balance: 'asc' }
                            }) || await tx.gameAccount.findFirst({
                                where: { isActive: true },
                                orderBy: { balance: 'asc' }
                            })
                            if (autoAcc) targetAccId = autoAcc.id
                        }
                        if (targetAccId) {
                            await tx.gameAccount.update({
                                where: { id: targetAccId },
                                data: { balance: { increment: transaction.amount_chip } }
                            })
                        }
                    }
                    // Money Sent: Bank Balance - (jika stage === 2 atau isDirect)
                    if (stage === 2 || isDirect) {
                        let targetBankId = bank_id ? Number(bank_id) : (transaction.payment_method_id || transaction.withdraw_method_id)
                        if (!targetBankId) {
                            const autoBank = await tx.paymentMethod.findFirst({
                                where: { isActive: true, balance: { gte: transaction.amount_money } },
                                orderBy: { balance: 'desc' }
                            }) || await tx.paymentMethod.findFirst({
                                where: { isActive: true },
                                orderBy: { balance: 'desc' }
                            })
                            if (autoBank) targetBankId = autoBank.id
                        }
                        if (targetBankId) {
                            await tx.paymentMethod.update({
                                where: { id: targetBankId },
                                data: { balance: { decrement: transaction.amount_money } }
                            })
                        }
                    }
                } else if (transaction.type === 'REFERRAL_WD') {
                    if (stage === 2 || isDirect) {
                        // Money Sent: Bank Balance -
                        let targetBankId = bank_id ? Number(bank_id) : (transaction.payment_method_id || transaction.withdraw_method_id)
                        if (targetBankId) {
                            await tx.paymentMethod.update({
                                where: { id: targetBankId },
                                data: { balance: { decrement: transaction.amount_money } }
                            })
                        }
                    }
                }
            }

            return t
        }, {
            maxWait: 10000, // Wait max 10s for connection
            timeout: 20000  // Allow 20s for transaction to finish
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        const msg = error instanceof Error ? error.message : 'Unknown approval error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
