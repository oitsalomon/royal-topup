import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateMemberStats, awardLoyaltyPoints } from '@/services/member'
import { processReferralBonus, reverseReferralBonus } from '@/services/referral'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : null
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { stage, action, game_account_id, bank_id } = body // stage: 1 or 2, action: APPROVE or DECLINE

        // Priority: Header ID -> Body ID -> 1 (System/Fallback)
        let userId = getUserId(request)
        if (!userId && body.admin_id) userId = Number(body.admin_id)
        if (!userId) userId = 1

        const transaction = await prisma.transaction.findUnique({
            where: { id: Number(id) }
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        // Race Condition Check: Ensure we are acting on the expected status
        let expectedCurrentStatus = ''

        if (action === 'APPROVE') {
            if (transaction.type === 'TOPUP') {
                if (stage === 1) expectedCurrentStatus = 'PENDING'
                if (stage === 2) expectedCurrentStatus = 'APPROVED_1'
            } else if (transaction.type === 'WITHDRAW') {
                if (stage === 1) expectedCurrentStatus = 'PENDING'
                if (stage === 2) expectedCurrentStatus = 'APPROVED_1'
            } else if (transaction.type === 'REFERRAL_WD') {
                if (stage === 1) expectedCurrentStatus = 'PENDING'
                if (stage === 2) expectedCurrentStatus = 'APPROVED_1'
            }
        } else {
            // For Decline, we generally expect it to be pending or approved_1
            // But if it's already declined or completed (approved_2), we should block.
            if (transaction.status === 'DECLINED' || transaction.status === 'APPROVED_2') {
                return NextResponse.json({
                    error: 'Transaction already finalized by another admin',
                    code: 'CONFLICT'
                }, { status: 409 })
            }
        }

        // Strict check for APPROVE flow
        if (action === 'APPROVE' && transaction.status !== expectedCurrentStatus) {
            return NextResponse.json({
                error: 'Status has changed. Please refresh.',
                code: 'CONFLICT',
                currentStatus: transaction.status
            }, { status: 409 })
        }

        let newStatus = transaction.status

        if (action === 'DECLINE') {
            newStatus = 'DECLINED'
        } else if (action === 'APPROVE') {
            if (transaction.type === 'TOPUP') {
                // Top Up Flow
                if (stage === 1 && transaction.status === 'PENDING') {
                    newStatus = 'APPROVED_1' // Money Received
                } else if (stage === 2 && transaction.status === 'APPROVED_1') {
                    newStatus = 'APPROVED_2' // Chip Sent (Completed)
                }
            } else if (transaction.type === 'WITHDRAW') {
                // Withdraw Flow
                if (stage === 1 && transaction.status === 'PENDING') {
                    newStatus = 'APPROVED_1' // Chip Received
                } else if (stage === 2 && transaction.status === 'APPROVED_1') {
                    newStatus = 'APPROVED_2' // Money Sent (Completed)
                }
            } else if (transaction.type === 'REFERRAL_WD') {
                // Referral WD Flow
                if (stage === 1 && transaction.status === 'PENDING') {
                    newStatus = 'APPROVED_1' // Validated
                } else if (stage === 2 && transaction.status === 'APPROVED_1') {
                    newStatus = 'APPROVED_2' // Money Sent (Completed)
                }
            }
        }

        const updated = await prisma.$transaction(async (tx: any) => {
            const t = await tx.transaction.update({
                where: { id: Number(id) },
                data: {
                    status: newStatus,
                    processed_by_id: userId
                }
            })

            // Log Activity for both APPROVE and DECLINE
            await tx.activityLog.create({
                data: {
                    user_id: userId,
                    action: action === 'APPROVE' ? 'APPROVE_TX' : 'DECLINE_TX',
                    details: `Transaction #${id} ${transaction.type} Stage ${stage} ${action === 'APPROVE' ? 'Approved' : 'Declined'}`,
                    ip_address: '127.0.0.1'
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
                    if (stage === 1) {
                        // Money Received: Bank Balance + (User sent to this bank)
                        await tx.paymentMethod.update({
                            where: { id: transaction.payment_method_id },
                            data: { balance: { increment: transaction.amount_money } }
                        })
                    } else if (stage === 2) {
                        // Chip Sent: Game Account Balance -
                        if (game_account_id) {
                            await tx.gameAccount.update({
                                where: { id: Number(game_account_id) },
                                data: { balance: { decrement: transaction.amount_chip } }
                            })
                        }

                        // Update Member Stats (Turnover, EXP)
                        // ONLY if the transaction is linked to a user
                        // parameter 2: amountChip (for turnover calculation)
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
                    if (stage === 1) {
                        // Chip Received: Game Account Balance +
                        if (game_account_id) {
                            await tx.gameAccount.update({
                                where: { id: Number(game_account_id) },
                                data: { balance: { increment: transaction.amount_chip } }
                            })
                        }
                    } else if (stage === 2) {
                        // Money Sent: Bank Balance -
                        if (bank_id) {
                            await tx.paymentMethod.update({
                                where: { id: Number(bank_id) },
                                data: { balance: { decrement: transaction.amount_money } }
                            })
                        }
                    }
                } else if (transaction.type === 'REFERRAL_WD') {
                    if (stage === 2) {
                        // Money Sent: Bank Balance -
                        if (bank_id) {
                            await tx.paymentMethod.update({
                                where: { id: Number(bank_id) },
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
