import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeText } from '@/lib/validations'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const rawSearch = searchParams.get('search') || ''
        const search = sanitizeText(rawSearch).trim()

        if (!search || search.length < 5) {
            return NextResponse.json({
                error: 'Nomor WhatsApp atau ID Transaksi wajib diisi (minimal 5 karakter).'
            }, { status: 400 })
        }

        // Cari transaksi berdasarkan trx_id atau user_wa
        const transaction = await prisma.transaction.findFirst({
            where: {
                OR: [
                    { trx_id: { equals: search, mode: 'insensitive' } },
                    { user_wa: { equals: search } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                trx_id: true,
                status: true,
                type: true,
                amount_chip: true,
                amount_money: true,
                nickname: true,
                user_game_id: true,
                proof_image: true,
                createdAt: true,
                game: {
                    select: { name: true }
                },
                paymentMethod: {
                    select: { name: true }
                }
            }
        })

        if (!transaction) {
            return NextResponse.json({
                error: 'Tidak ditemukan transaksi dengan nomor WhatsApp atau kode tersebut.'
            }, { status: 404 })
        }

        return NextResponse.json({
            data: transaction
        })
    } catch (error) {
        console.error('Track transaction error:', error)
        return NextResponse.json({ error: 'Gagal melacak transaksi.' }, { status: 500 })
    }
}
