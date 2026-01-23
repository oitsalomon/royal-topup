
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'
import { updateMemberStats } from '@/services/member'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            user_wa, game_id, user_game_id, nickname, amount_chip, amount_money,
            payment_method_id, proof_image, type, target_payment_details
        } = body

        // Try to identify user
        let userId: number | null = null
        if (body.user_id) userId = Number(body.user_id)

        // If not explicit, lookup by Game ID
        if (!userId && user_game_id) {
            const linked = await prisma.userGameId.findFirst({
                where: {
                    game_id: Number(game_id),
                    game_user_id: user_game_id?.trim()
                }
            })
            if (linked) userId = linked.user_id
        }

        // Prepare data
        let finalAmountMoney = Number(amount_money)

        // Fetch Payment Method Details (needed for Unique Code Check & Association)
        let paymentMethodName = ''
        if (type === 'TOPUP' && payment_method_id) {
            const pm = await prisma.paymentMethod.findUnique({ where: { id: Number(payment_method_id) } })
            if (pm) paymentMethodName = pm.name
        }

        // Add Unique Code (Random 1-199) ONLY for QRIS TOPUP
        if (type === 'TOPUP') {
            const isQRIS = paymentMethodName.toLowerCase().includes('qris')
            if (isQRIS) {
                const uniqueCode = Math.floor(Math.random() * 199) + 1
                finalAmountMoney += uniqueCode
            }
        }

        const transactionData: any = {
            user_wa,
            user_id: userId, // Link to user if found
            game_id: Number(game_id),
            user_game_id: user_game_id || '',
            nickname,
            amount_chip: Number(amount_chip),
            amount_money: finalAmountMoney,
            proof_image: proof_image || null, // Optional
            type, // TOPUP or WITHDRAW
            target_payment_details,
            status: (type === 'WITHDRAW' || userId || proof_image) ? 'PENDING' : 'UNPAID'
        }

        // Handle Payment ID mapping based on Type
        if (type === 'TOPUP') {
            transactionData.payment_method_id = Number(payment_method_id)
        } else if (type === 'WITHDRAW') {
            // For Withdraw, payment_method_id from frontend is actually withdraw_method_id
            transactionData.withdraw_method_id = Number(payment_method_id)
        }

        const transaction = await prisma.transaction.create({
            data: transactionData,
            include: {
                paymentMethod: true
            }
        })

        // Update Member Stats (Async)
        if (userId && type === 'TOPUP') {
            updateMemberStats(userId, Number(amount_chip)).catch(e => console.error('Stats update failed:', e))

            // AUTO-SAVE GAME IDLogic
            if (user_game_id) {
                prisma.userGameId.findFirst({
                    where: {
                        user_id: userId,
                        game_id: Number(game_id),
                        game_user_id: user_game_id.toString()
                    }
                }).then(existing => {
                    if (!existing) {
                        prisma.userGameId.create({
                            data: {
                                user_id: userId!,
                                game_id: Number(game_id),
                                game_user_id: user_game_id.toString(),
                                nickname: nickname || ''
                            }
                        }).catch(e => console.error('Failed to auto-save game ID:', e))
                    }
                }).catch(e => console.error('Error checking existing game ID:', e))
            }
        }

        // Send notification to Telegram (Mocked for now)
        console.log(`[TELEGRAM] New ${type} transaction:`, transaction)

        return NextResponse.json(transaction)
    } catch (error) {
        console.error('Transaction create error:', error)
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const bank_id = searchParams.get('bank_id')
        const date = searchParams.get('date')
        const search = searchParams.get('search')
        const page = Number(searchParams.get('page')) || 1
        const limit = Number(searchParams.get('limit')) || 20

        const result = await getTransactions({
            status,
            type,
            bank_id,
            date,
            search,
            page,
            limit
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Transaction fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}
