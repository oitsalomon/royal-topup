import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser, getClientIp } from '@/lib/session-helper'

export async function GET() {
    try {
        const dcbos = await prisma.dcBos.findMany({
            include: {
                user: {
                    select: { id: true, username: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(dcbos)
    } catch (error) {
        console.error('Fetch DC BOS error:', error)
        return NextResponse.json({ error: 'Failed to fetch DC BOS' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { amount, type = 'uang', bank_name, note, bank_id } = body

        const numAmount = Number(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            return NextResponse.json({ error: 'Nominal setoran DC Bos harus lebih dari 0' }, { status: 400 })
        }

        const admin = await resolveAdminUser(request)
        const clientIp = getClientIp(request)

        const result = await prisma.$transaction(async (tx) => {
            const dcbos = await tx.dcBos.create({
                data: {
                    user_id: admin.id,
                    work_session_id: admin.work_session_id,
                    amount: numAmount,
                    type: String(type).toLowerCase(), // 'uang' | 'chip'
                    bank_name: bank_name ? String(bank_name).trim() : null,
                    note: note ? String(note).trim() : null
                },
                include: {
                    user: {
                        select: { id: true, username: true }
                    }
                }
            })

            // Jika ada bank_id, kurangi saldo bank operasional toko karena disetor ke bos
            if (bank_id && type === 'uang') {
                const bId = Number(bank_id)
                const targetBank = await tx.paymentMethod.findUnique({ where: { id: bId } })
                if (targetBank) {
                    await tx.paymentMethod.update({
                        where: { id: bId },
                        data: { balance: { decrement: numAmount } }
                    })
                }
            }

            const details = `DC Bos / Setoran: ${type === 'uang' ? 'Rp ' + numAmount.toLocaleString('id-ID') : numAmount + 'B'}${dcbos.bank_name ? ' ke ' + dcbos.bank_name : ''}${dcbos.note ? ' - ' + dcbos.note : ''}`

            await tx.activityLog.create({
                data: {
                    user_id: admin.id,
                    work_session_id: admin.work_session_id,
                    action: 'DC_BOS',
                    details,
                    ip_address: clientIp
                }
            }).catch(err => console.error('ActivityLog DC_BOS error:', err))

            return dcbos
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Create DC BOS error:', error)
        return NextResponse.json({ error: error?.message || 'Gagal mencatat setoran DC Bos' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) {
            return NextResponse.json({ error: 'ID DC Bos wajib disertakan' }, { status: 400 })
        }

        const admin = await resolveAdminUser(request)
        const clientIp = getClientIp(request)

        const existing = await prisma.dcBos.findUnique({
            where: { id: Number(id) }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Catatan DC Bos tidak ditemukan' }, { status: 404 })
        }

        await prisma.dcBos.delete({
            where: { id: Number(id) }
        })

        await prisma.activityLog.create({
            data: {
                user_id: admin.id,
                work_session_id: admin.work_session_id,
                action: 'HAPUS_DC_BOS',
                details: `Hapus catatan DC Bos #${id}: ${existing.type} ${existing.amount} (${existing.bank_name || '-'})`,
                ip_address: clientIp
            }
        }).catch(err => console.error('ActivityLog delete DC_BOS error:', err))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete DC BOS error:', error)
        return NextResponse.json({ error: error?.message || 'Gagal menghapus data DC Bos' }, { status: 500 })
    }
}
