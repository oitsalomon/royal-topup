import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const adjustments = await prisma.adjustment.findMany({
            include: {
                user: true,
                bank: true,
                gameAccount: { include: { game: true } }
            },
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
        const { type, action, amount, note, target_id } = body
        // type: 'MONEY' | 'CHIP'
        // action: 'ADD' | 'SUBTRACT'
        // target_id: ID of Bank (for Money) or GameAccount (for Chip). If null, assumes Admin/General.

        const numAmount = Number(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        // 1. Handle Money Adjustment
        if (type === 'MONEY') {
            // If target_id is provided, update specific Bank (PaymentMethod)
            if (target_id) {
                const bank = await prisma.paymentMethod.findUnique({ where: { id: Number(target_id) } })
                if (!bank) return NextResponse.json({ error: 'Bank not found' }, { status: 404 })

                const newBalance = action === 'ADD'
                    ? bank.balance + numAmount
                    : bank.balance - numAmount

                await prisma.paymentMethod.update({
                    where: { id: Number(target_id) },
                    data: { balance: newBalance }
                })

                await prisma.paymentMethod.update({
                    where: { id: Number(target_id) },
                    data: { balance: newBalance }
                })
            } else {
                // Update Admin Balance (User ID 1 for now)
                const admin = await prisma.user.findUnique({ where: { id: 1 } })
                if (admin) {
                    const newBalance = action === 'ADD'
                        ? admin.balance_money + numAmount
                        : admin.balance_money - numAmount

                    await prisma.user.update({
                        where: { id: 1 },
                        data: { balance_money: newBalance }
                    })
                }
            }
        }

        // 2. Handle Chip Adjustment
        else if (type === 'CHIP') {
            // If target_id is provided, update specific GameAccount
            if (target_id) {
                const account = await prisma.gameAccount.findUnique({ where: { id: Number(target_id) } })
                if (!account) return NextResponse.json({ error: 'Game Account not found' }, { status: 404 })

                const newBalance = action === 'ADD'
                    ? account.balance + numAmount
                    : account.balance - numAmount

                await prisma.gameAccount.update({
                    where: { id: Number(target_id) },
                    data: { balance: newBalance }
                })
            } else {
                // Update Admin Chip Balance (User ID 1)
                const admin = await prisma.user.findUnique({ where: { id: 1 } })
                if (admin) {
                    const newBalance = action === 'ADD'
                        ? admin.balance_chip + numAmount
                        : admin.balance_chip - numAmount

                    await prisma.user.update({
                        where: { id: 1 },
                        data: { balance_chip: newBalance }
                    })
                }
            }
        }

        // If it was a specific target adjustment, we already created the record above? 
        // Wait, the previous logic relied on a generic log at the end. 
        // I need to refactor to create the Adjustment record properly in all cases.

        // Let's simplify: 
        // 1. Perform the balance update.
        // 2. Create the Adjustment record with the correct links.

        let bank_id = null
        let game_account_id = null

        if (type === 'MONEY' && target_id) bank_id = Number(target_id)
        if (type === 'CHIP' && target_id) game_account_id = Number(target_id)

        await prisma.adjustment.create({
            data: {
                user_id: 1,
                amount: action === 'ADD' ? numAmount : -numAmount,
                type,
                reason: note || 'Manual Adjustment',
                bank_id,
                game_account_id
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Adjustment failed' }, { status: 500 })
    }
}
