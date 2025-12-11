import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
    // 1. Get the base URL
    let connectionUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || ""

    // 2. Hack: If it contains "-pooler", strip it to guess the Direct URL
    if (connectionUrl.includes('-pooler')) {
        console.log("Detected pooler URL, attempting to derive direct URL...")
        connectionUrl = connectionUrl.replace('-pooler', '')
    }

    // 3. Force Aggressive Timeouts (connect_timeout=10)
    if (!connectionUrl.includes('?')) {
        connectionUrl += '?connect_timeout=20&pool_timeout=20'
    }

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: connectionUrl
            }
        }
    })

    try {
        const maskedUrl = connectionUrl.split('@')[1] || "invalid"
        console.log("Starting emergency fix with URL:", maskedUrl)

        // 1. Wipe all Game Images (Raw SQL is faster/lighter)
        console.log("Wiping game images...")
        const countGames = await prisma.$executeRaw`UPDATE "Game" SET "image" = NULL`

        // 2. Wipe all Bank QRIS Images
        console.log("Wiping bank images...")
        const countBanks = await prisma.$executeRaw`UPDATE "PaymentMethod" SET "image" = NULL`

        await prisma.$disconnect()

        return NextResponse.json({
            success: true,
            message: `BERHASIL! ${countGames} Game images dan ${countBanks} Bank images telah dihapus via RAW SQL.`,
            games_cleaned: countGames,
            banks_cleaned: countBanks,
            debug_host: maskedUrl
        })
    } catch (error: any) {
        console.error("Emergency Fix Error:", error)
        await prisma.$disconnect()
        return NextResponse.json({
            error: true,
            message: 'Gagal koneksi ke database. Mohon refresh 1-2 kali lagi.',
            detail: error.message,
            debug_host: connectionUrl.split('@')[1] || "invalid"
        }, { status: 500 })
    }
}
