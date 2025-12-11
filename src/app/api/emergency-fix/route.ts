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

    // 3. Force Aggressive Timeouts
    if (!connectionUrl.includes('?')) {
        connectionUrl += '?connect_timeout=30&pool_timeout=30'
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

        // 1. Fetch IDs first (Lightweight)
        const games = await prisma.game.findMany({ select: { id: true } })
        const banks = await prisma.paymentMethod.findMany({ select: { id: true }, where: { type: 'BANK' } })

        console.log(`Found ${games.length} games and ${banks.length} banks. Cleaning in batches...`)

        let gamesCleaned = 0
        let banksCleaned = 0

        // 2. Clean Games One by One (To prevent timeout/transaction overflow)
        for (const game of games) {
            await prisma.game.update({
                where: { id: game.id },
                data: { image: null }
            })
            gamesCleaned++
        }

        // 3. Clean Banks One by One
        for (const bank of banks) {
            await prisma.paymentMethod.update({
                where: { id: bank.id },
                data: { image: null }
            })
            banksCleaned++
        }

        await prisma.$disconnect()

        return NextResponse.json({
            success: true,
            message: `BERHASIL! ${gamesCleaned} Game images dan ${banksCleaned} Bank images telah dihapus secara bertahap (Batching).`,
            games_cleaned: gamesCleaned,
            banks_cleaned: banksCleaned,
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
