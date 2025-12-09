import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const transfers = await prisma.transfer.findMany({
            include: {
                sender: true,
                receiver: true,
                fromBank: true,
                toBank: true,
                fromGameAccount: { include: { game: true } },
                toGameAccount: { include: { game: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(transfers)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { type, source_id, target_id, amount, note } = body
        // type: 'MONEY' | 'CHIP'

        const numAmount = Number(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        if (source_id === target_id) {
            return NextResponse.json({ error: 'Source and Target cannot be the same' }, { status: 400 })
        }

        // 1. Handle Money Transfer (Bank to Bank)
        if (type === 'MONEY') {
            const sourceBank = await prisma.paymentMethod.findUnique({ where: { id: Number(source_id) } })
            const targetBank = await prisma.paymentMethod.findUnique({ where: { id: Number(target_id) } })

            if (!sourceBank || !targetBank) return NextResponse.json({ error: 'Bank not found' }, { status: 404 })
            if (sourceBank.balance < numAmount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

            // Transaction
            await prisma.$transaction([
                prisma.paymentMethod.update({
                    where: { id: Number(source_id) },
                    data: { balance: sourceBank.balance - numAmount }
                }),
                prisma.paymentMethod.update({
                    where: { id: Number(target_id) },
                    data: { balance: targetBank.balance + numAmount }
                })
            ])
        }

        // 2. Handle Chip Transfer (Game Account to Game Account)
        else if (type === 'CHIP') {
            const sourceAcc = await prisma.gameAccount.findUnique({ where: { id: Number(source_id) } })
            const targetAcc = await prisma.gameAccount.findUnique({ where: { id: Number(target_id) } })

            if (!sourceAcc || !targetAcc) return NextResponse.json({ error: 'Game Account not found' }, { status: 404 })
            if (sourceAcc.balance < numAmount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

            // Transaction
            await prisma.$transaction([
                prisma.gameAccount.update({
                    where: { id: Number(source_id) },
                    data: { balance: sourceAcc.balance - numAmount }
                }),
                prisma.gameAccount.update({
                    where: { id: Number(target_id) },
                    data: { balance: targetAcc.balance + numAmount }
                })
            ])
        }

        // Create Transfer Record
        await prisma.transfer.create({
            data: {
                amount: numAmount,
                type,
                note,
                from_bank_id: type === 'MONEY' ? Number(source_id) : null,
                to_bank_id: type === 'MONEY' ? Number(target_id) : null,
                from_game_account_id: type === 'CHIP' ? Number(source_id) : null,
                to_game_account_id: type === 'CHIP' ? Number(target_id) : null,
                // For now system transfer, so no user_id linked
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Transfer failed' }, { status: 500 })
    }
}
