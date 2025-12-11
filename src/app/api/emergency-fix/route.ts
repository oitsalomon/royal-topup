import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // 1. Wipe all Game Images
        const result = await prisma.game.updateMany({
            where: {}, // Target all records
            data: {
                image: null
            }
        })

        // 2. Wipe all Bank QRIS Images
        const bankResult = await prisma.paymentMethod.updateMany({
            where: {}, // Target all records
            data: {
                image: null
            }
        })

        return NextResponse.json({
            success: true,
            message: `BERHASIL! ${result.count} Game images dan ${bankResult.count} Bank images telah dihapus. Database sekarang enteng/ringan kembali.`,
            games_cleaned: result.count,
            banks_cleaned: bankResult.count
        })
    } catch (error) {
        return NextResponse.json({ error: 'Gagal melakukan pembersihan: ' + error }, { status: 500 })
    }
}
