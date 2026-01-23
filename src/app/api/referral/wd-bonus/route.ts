import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Handles withdrawal requests from the bonus wallet.
 * POST /api/referral/wd-bonus
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { user_id } = body

        if (!user_id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(user_id) }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // --- VALIDATION RULES ---

        // 1. Personal topup minimal 1B in the current week
        if (user.weekly_personal_topup_B < 1) {
            return NextResponse.json({
                error: 'Syarat WD bonus: Top up pribadi minimal 1B minggu ini.'
            }, { status: 403 })
        }

        // 2. Minimal saldo bonus Rp20.000
        if (user.balance_bonus < 20000) {
            return NextResponse.json({
                error: 'Syarat WD bonus: Minimal saldo Rp 20.000.'
            }, { status: 403 })
        }

        // 3. Maksimal 1x per minggu
        if (user.wd_bonus_this_week) {
            return NextResponse.json({
                error: 'Anda sudah melakukan WD bonus minggu ini. Silakan coba lagi minggu depan.'
            }, { status: 403 })
        }

        // --- EXECUTION ---
        const result = await prisma.$transaction(async (tx) => {
            // Re-fetch user inside transaction with lock
            const u = await (tx as any).user.findUnique({
                where: { id: user.id },
            })

            // Double check validation inside transaction
            if (u.weekly_personal_topup_B < 1 || u.balance_bonus < 20000 || u.wd_bonus_this_week) {
                throw new Error('Syarat WD tidak terpenuhi atau sudah dilakukan minggu ini.')
            }

            const amountToWd = u.balance_bonus

            // Find matching withdraw method ID
            const wm = await (tx as any).withdrawMethod.findFirst({
                where: { name: { contains: u.bank_name, mode: 'insensitive' } }
            })

            // 1. Deduct bonus balance & set flag (immediate, will be refunded if declined)
            const updatedUser = await tx.user.update({
                where: { id: u.id },
                data: {
                    balance_bonus: 0,
                    wd_bonus_this_week: true,
                }
            })

            // 2. Create Transaction for Admin to Approve
            const transaction = await tx.transaction.create({
                data: {
                    user_id: u.id,
                    user_wa: u.whatsapp || '',
                    game_id: 4, // Placeholder Royal Dream
                    nickname: u.username,
                    amount_chip: 0,
                    amount_money: amountToWd,
                    type: 'REFERRAL_WD',
                    status: 'PENDING',
                    withdraw_method_id: wm?.id || null,
                    target_payment_details: `${u.bank_name} - ${u.account_number} (${u.account_name})`
                }
            })

            // 3. Create Activity Log
            await tx.activityLog.create({
                data: {
                    user_id: u.id,
                    action: 'WD_BONUS_REQUEST',
                    details: `Request withdrawal of referral bonus: Rp ${amountToWd.toLocaleString()}. Transaction #${transaction.id}`,
                    ip_address: '127.0.0.1'
                }
            })

            return { updatedUser, amountToWd, transactionId: transaction.id }
        })

        return NextResponse.json({
            success: true,
            message: 'Permintaan WD Bonus berhasil dikirim! Menunggu persetujuan Admin.',
            new_balance_money: result.updatedUser.balance_money,
            new_balance_bonus: result.updatedUser.balance_bonus,
            amount: result.amountToWd,
            transaction_id: result.transactionId
        })

    } catch (error) {
        console.error('WD Bonus error:', error)
        return NextResponse.json({ error: 'Failed to process WD bonus' }, { status: 500 })
    }
}
