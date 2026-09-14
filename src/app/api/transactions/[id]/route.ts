import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTopupNotif } from '@/lib/telegram'
import { getAdminSessionFromRequest } from '@/lib/auth'
import { sanitizeText } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const adminSession = await getAdminSessionFromRequest(request)

        const transaction = await prisma.transaction.findUnique({
            where: { id: Number(id) },
            include: {
                paymentMethod: true,
                withdrawMethod: true,
                game: true
            }
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
        }

        // Jika bukan admin, hanya kembalikan informasi terbatas (cegah IDOR)
        if (!adminSession) {
            return NextResponse.json({
                id: transaction.id,
                trx_id: transaction.trx_id,
                status: transaction.status,
                type: transaction.type,
                amount_chip: transaction.amount_chip,
                amount_money: transaction.amount_money,
                nickname: transaction.nickname,
                createdAt: transaction.createdAt,
                game: transaction.game,
                paymentMethod: transaction.paymentMethod ? { name: transaction.paymentMethod.name } : null
            })
        }

        return NextResponse.json(transaction)
    } catch (error) {
        return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: rawId } = await params
        const id = Number(rawId)
        const body = await request.json().catch(() => ({}))
        const { target_payment_details, user_game_id, proof_image, amount_chip } = body

        const adminSession = await getAdminSessionFromRequest(request)

        // Hanya Admin/Staff yang boleh mengubah target_payment_details, user_game_id, atau amount_chip
        const isEditingDetails = target_payment_details !== undefined || user_game_id !== undefined || amount_chip !== undefined
        if (isEditingDetails && !adminSession) {
            return NextResponse.json({
                error: 'Unauthorized: Hanya admin yang berwenang mengubah detail rekening, ID game, atau nominal chip transaksi.'
            }, { status: 401 })
        }

        const updateData: any = {}
        if (target_payment_details !== undefined) updateData.target_payment_details = sanitizeText(target_payment_details)
        if (user_game_id !== undefined) updateData.user_game_id = sanitizeText(user_game_id)
        if (amount_chip !== undefined) {
            const numChip = Number(amount_chip)
            if (!isNaN(numChip) && numChip > 0) {
                updateData.amount_chip = numChip
            }
        }
        if (proof_image !== undefined) {
            updateData.proof_image = proof_image
            updateData.status = 'PENDING'
        }

        const updated = await prisma.transaction.update({
            where: { id },
            data: updateData,
            include: {
                paymentMethod: true,
                withdrawMethod: true,
                user: true,
                game: true
            }
        })

        // Log Aktivitas jika dilakukan oleh admin
        if (adminSession) {
            await prisma.activityLog.create({
                data: {
                    user_id: adminSession.id,
                    action: 'UPDATE_TX',
                    details: `Admin ${adminSession.username} updated Transaction #${id}`,
                    ip_address: '127.0.0.1'
                }
            }).catch(() => {})
        }

        // TRIGGER TELEGRAM NOTIFICATION ON PROOF UPLOAD
        if (proof_image && updated.type === 'TOPUP') {
            const isGuest = !updated.user_id
            sendTopupNotif({
                id: updated.id,
                trxId: updated.trx_id || String(updated.id),
                userName: updated.nickname || updated.user?.username || 'Guest',
                accountName: updated.sender_name || updated.user?.account_name,
                gameId: updated.user_game_id || String(updated.game_id),
                chipAmount: updated.amount_chip,
                totalPrice: updated.amount_money,
                paymentMethod: updated.paymentMethod?.name || 'Manual',
                createdAt: updated.createdAt,
                isGuest,
                proofImage: updated.proof_image
            }).catch(e => console.error('Telegram TOPUP notif (PATCH) failed:', e))
        }

        return NextResponse.json(updated)

    } catch (error) {
        console.error('Update TX Error:', error)
        return NextResponse.json({ error: 'Gagal memperbarui transaksi.' }, { status: 500 })
    }
}
