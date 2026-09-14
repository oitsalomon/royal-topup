import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser, getClientIp } from '@/lib/session-helper'

export async function GET() {
    try {
        const transfers = await prisma.transfer.findMany({
            include: {
                sender: { select: { id: true, username: true } },
                receiver: { select: { id: true, username: true } },
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
            return NextResponse.json({ error: 'Nominal transfer tidak valid' }, { status: 400 })
        }

        if (source_id === target_id) {
            return NextResponse.json({ error: 'Rekening/Akun asal dan tujuan tidak boleh sama' }, { status: 400 })
        }

        const admin = await resolveAdminUser(request)
        const clientIp = getClientIp(request)

        // 1. Handle Money Transfer (Bank to Bank)
        if (type === 'MONEY') {
            const sourceBank = await prisma.paymentMethod.findUnique({ where: { id: Number(source_id) } })
            const targetBank = await prisma.paymentMethod.findUnique({ where: { id: Number(target_id) } })

            if (!sourceBank || !targetBank) return NextResponse.json({ error: 'Bank tidak ditemukan' }, { status: 404 })
            if (sourceBank.balance < numAmount) return NextResponse.json({ error: 'Saldo bank asal tidak mencukupi' }, { status: 400 })

            await prisma.$transaction(async (tx) => {
                await tx.paymentMethod.update({
                    where: { id: Number(source_id) },
                    data: { balance: { decrement: numAmount } }
                })
                await tx.paymentMethod.update({
                    where: { id: Number(target_id) },
                    data: { balance: { increment: numAmount } }
                })

                await tx.transfer.create({
                    data: {
                        amount: numAmount,
                        type,
                        note: note || null,
                        from_user_id: admin.id,
                        work_session_id: admin.work_session_id,
                        from_bank_id: Number(source_id),
                        to_bank_id: Number(target_id),
                    }
                })

                const details = `Transfer Bank: Rp ${numAmount.toLocaleString('id-ID')} dari ${sourceBank.name} (${sourceBank.account_number}) ke ${targetBank.name} (${targetBank.account_number})${note ? ' - Ket: ' + note : ''}`

                await tx.activityLog.create({
                    data: {
                        user_id: admin.id,
                        work_session_id: admin.work_session_id,
                        action: 'TRANSFER_BANK',
                        details,
                        ip_address: clientIp
                    }
                })
            })
        }

        // 2. Handle Chip Transfer (Game Account to Game Account)
        else if (type === 'CHIP') {
            const sourceAcc = await prisma.gameAccount.findUnique({ where: { id: Number(source_id) } })
            const targetAcc = await prisma.gameAccount.findUnique({ where: { id: Number(target_id) } })

            if (!sourceAcc || !targetAcc) return NextResponse.json({ error: 'Akun Game tidak ditemukan' }, { status: 404 })
            if (sourceAcc.balance < numAmount) return NextResponse.json({ error: 'Stok chip akun asal tidak mencukupi' }, { status: 400 })

            await prisma.$transaction(async (tx) => {
                await tx.gameAccount.update({
                    where: { id: Number(source_id) },
                    data: { balance: { decrement: numAmount } }
                })
                await tx.gameAccount.update({
                    where: { id: Number(target_id) },
                    data: { balance: { increment: numAmount } }
                })

                await tx.transfer.create({
                    data: {
                        amount: numAmount,
                        type,
                        note: note || null,
                        from_user_id: admin.id,
                        work_session_id: admin.work_session_id,
                        from_game_account_id: Number(source_id),
                        to_game_account_id: Number(target_id),
                    }
                })

                const details = `Transfer Chip: ${numAmount}B dari ID ${sourceAcc.username} ke ID ${targetAcc.username}${note ? ' - Ket: ' + note : ''}`

                await tx.activityLog.create({
                    data: {
                        user_id: admin.id,
                        work_session_id: admin.work_session_id,
                        action: 'TRANSFER_CHIP',
                        details,
                        ip_address: clientIp
                    }
                })
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Transfer failed:', error)
        return NextResponse.json({ error: error?.message || 'Transfer gagal diproses' }, { status: 500 })
    }
}
