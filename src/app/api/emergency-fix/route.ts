import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
    const prisma = new PrismaClient() // Fresh instance specifically for this emergency op

    try {
        console.log("Starting emergency fix...")

        // 1. Wipe all Game Images
        console.log("Wiping game images...")
        const result = await prisma.game.updateMany({
            where: {},
            data: { image: null }
        })

        // 2. Wipe all Bank QRIS Images
        console.log("Wiping bank images...")
        const bankResult = await prisma.paymentMethod.updateMany({
            where: {},
            data: { image: null }
        })

        await prisma.$disconnect()

        return NextResponse.json({
            success: true,
            message: `BERHASIL! ${result.count} Game images dan ${bankResult.count} Bank images telah dihapus. Database sekarang enteng/ringan kembali.`,
            games_cleaned: result.count,
            banks_cleaned: bankResult.count
        })
    } catch (error: any) {
        console.error("Emergency Fix Error:", error)
        await prisma.$disconnect()
        return NextResponse.json({
            error: true,
            message: 'Gagal koneksi ke database. Mohon refresh 1-2 kali lagi.',
            detail: error.message
        }, { status: 500 })
    }
}
