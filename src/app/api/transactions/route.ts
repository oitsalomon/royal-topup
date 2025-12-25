
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            user_wa, game_id, user_game_id, nickname, amount_chip, amount_money,
            payment_method_id, proof_image, type, target_payment_details
        } = body

        // Prepare data
        const transactionData: any = {
            user_wa,
            game_id: Number(game_id),
            user_game_id: user_game_id || '',
            nickname,
            amount_chip: Number(amount_chip),
            amount_money: Number(amount_money),
            proof_image,
            type, // TOPUP or WITHDRAW
            target_payment_details,
            status: 'PENDING'
        }

        // Handle Payment ID mapping based on Type
        if (type === 'TOPUP') {
            transactionData.payment_method_id = Number(payment_method_id)
        } else if (type === 'WITHDRAW') {
            // For Withdraw, payment_method_id from frontend is actually withdraw_method_id
            transactionData.withdraw_method_id = Number(payment_method_id)
        }

        const transaction = await prisma.transaction.create({
            data: transactionData
        })

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
