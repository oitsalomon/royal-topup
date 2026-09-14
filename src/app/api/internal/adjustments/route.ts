import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser, getClientIp } from '@/lib/session-helper'

export async function GET() {
    try {
        const adjustments = await prisma.adjustment.findMany({
            include: {
                user: { select: { id: true, username: true } },
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
        // target_id: ID of Bank (for Money) or GameAccount (for Chip)

        const numAmount = Number(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            return NextResponse.json({ error: 'Nominal penyesuaian tidak valid' }, { status: 400 })
        }

        const admin = await resolveAdminUser(request)
        const clientIp = getClientIp(request)

        const diff = action === 'ADD' ? numAmount : -numAmount
        let details = ''
        let bank_id: number | null = null
        let game_account_id: number | null = null

        await prisma.$transaction(async (tx) => {
            // 1. Handle Money Adjustment
            if (type === 'MONEY') {
                if (target_id) {
                    bank_id = Number(target_id)
                    const bank = await tx.paymentMethod.findUnique({ where: { id: bank_id } })
                    if (!bank) throw new Error('Bank tidak ditemukan')

                    const oldBal = Number(bank.balance || 0)
                    const newBal = Math.max(0, oldBal + diff)

                    await tx.paymentMethod.update({
                        where: { id: bank_id },
                        data: { balance: newBal }
                    })

                    const diffStr = (diff >= 0 ? '+' : '') + `Rp ${diff.toLocaleString('id-ID')}`
                    details = `Adjustment Saldo Bank ${bank.name} (${bank.account_number}): Rp ${oldBal.toLocaleString('id-ID')} -> Rp ${newBal.toLocaleString('id-ID')} (Selisih: ${diffStr}). Alasan: ${note || '-'}`
                } else {
                    const user = await tx.user.findUnique({ where: { id: admin.id } })
                    const oldBal = Number(user?.balance_money || 0)
                    const newBal = Math.max(0, oldBal + diff)
                    await tx.user.update({
                        where: { id: admin.id },
                        data: { balance_money: newBal }
                    })
                    details = `Adjustment Saldo User ${admin.username}: Rp ${oldBal.toLocaleString('id-ID')} -> Rp ${newBal.toLocaleString('id-ID')} (${diff >= 0 ? '+' : ''}${diff}). Alasan: ${note || '-'}`
                }
            }

            // 2. Handle Chip Adjustment
            else if (type === 'CHIP') {
                if (target_id) {
                    game_account_id = Number(target_id)
                    const account = await tx.gameAccount.findUnique({ where: { id: game_account_id } })
                    if (!account) throw new Error('Akun Game tidak ditemukan')

                    const oldBal = Number(account.balance || 0)
                    const rawNew = Math.max(0, oldBal + diff)
                    const newBal = Math.round(rawNew * 1000) / 1000

                    await tx.gameAccount.update({
                        where: { id: game_account_id },
                        data: { balance: newBal }
                    })

                    const diffStr = (diff >= 0 ? '+' : '') + `${diff}B`
                    details = `Adjustment Stok Chip ID ${account.username}: ${oldBal}B -> ${newBal}B (Selisih: ${diffStr}). Alasan: ${note || '-'}`
                } else {
                    const user = await tx.user.findUnique({ where: { id: admin.id } })
                    const oldBal = Number(user?.balance_chip || 0)
                    const newBal = Math.max(0, oldBal + diff)
                    await tx.user.update({
                        where: { id: admin.id },
                        data: { balance_chip: newBal }
                    })
                    details = `Adjustment Chip User ${admin.username}: ${oldBal}B -> ${newBal}B (${diff >= 0 ? '+' : ''}${diff}B). Alasan: ${note || '-'}`
                }
            }

            // 3. Create Adjustment Record
            await tx.adjustment.create({
                data: {
                    user_id: admin.id,
                    work_session_id: admin.work_session_id,
                    amount: diff,
                    type,
                    reason: note || 'Penyesuaian Manual',
                    bank_id,
                    game_account_id
                }
            })

            // 4. Create ActivityLog
            await tx.activityLog.create({
                data: {
                    user_id: admin.id,
                    work_session_id: admin.work_session_id,
                    action: 'ADJUSTMENT',
                    details,
                    ip_address: clientIp
                }
            })
        })

        return NextResponse.json({ success: true, details })
    } catch (error: any) {
        console.error('Adjustment error:', error)
        return NextResponse.json({ error: error?.message || 'Adjustment gagal diproses' }, { status: 500 })
    }
}
