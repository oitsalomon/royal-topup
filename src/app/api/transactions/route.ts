import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            user_wa, game_id, user_game_id, nickname, amount_chip, amount_money,
            payment_method_id, proof_image, type, target_payment_details
        } = body

        const transaction = await prisma.transaction.create({
            data: {
                user_wa,
                game_id: Number(game_id),
                user_game_id: user_game_id || '',
                nickname,
                amount_chip: Number(amount_chip),
                amount_money: Number(amount_money),
                payment_method_id: Number(payment_method_id),
                proof_image,
                type, // TOPUP or WITHDRAW
                target_payment_details,
                status: 'PENDING'
            }
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
        const date = searchParams.get('date') // YYYY-MM-DD

        const where: any = {}
        if (status) where.status = status
        if (type) where.type = type
        if (bank_id && bank_id !== 'all') where.payment_method_id = Number(bank_id)

        if (date) {
            const startDate = new Date(date)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(date)
            endDate.setHours(23, 59, 59, 999)

            where.createdAt = {
                gte: startDate,
                lte: endDate
            }
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                game: true,
                paymentMethod: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(transactions)
    } catch (error) {
        console.error('Transaction fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}
