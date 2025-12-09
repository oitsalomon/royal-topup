import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { stage, action, admin_id, game_account_id, bank_id } = body // stage: 1 or 2, action: APPROVE or DECLINE

        const transaction = await prisma.transaction.findUnique({
            where: { id: Number(id) }
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
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
            }
        }

        if (newStatus === transaction.status && action === 'APPROVE') {
            return NextResponse.json({ error: 'Invalid stage transition' }, { status: 400 })
        }

        const updated = await prisma.$transaction(async (tx: any) => {
            const t = await tx.transaction.update({
                where: { id: Number(id) },
                data: {
                    status: newStatus,
                    processed_by_id: admin_id ? Number(admin_id) : null
                }
            })

            if (action === 'APPROVE' && admin_id) {
                const adminId = Number(admin_id)

                // Log Activity
                await tx.activityLog.create({
                    data: {
                        user_id: adminId,
                        action: 'APPROVE_TX',
                        details: `Transaction #${id} ${transaction.type} Stage ${stage} Approved`,
                        ip_address: '127.0.0.1' // Mock IP
                    }
                })

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
                }
            }

            return t
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
    }
}
