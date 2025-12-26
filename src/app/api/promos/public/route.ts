import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const gameCode = searchParams.get('gameCode')

    if (!gameCode) {
        return NextResponse.json({ error: 'Game code required' }, { status: 400 })
    }

    try {
        // 1. Get Game -> Store Name
        const game = await prisma.game.findFirst({
            where: { code: gameCode },
            select: { store_name: true }
        })

        if (!game || !game.store_name) {
            return NextResponse.json(null) // No promo if no store or no game
        }

        // 2. Get Promo Config using store_name
        const config = await prisma.storePromoConfig.findUnique({
            where: { store_name: game.store_name },
            include: {
                packages: {
                    orderBy: { price: 'asc' }
                }
            }
        })

        if (!config || !config.isPromoActive) {
            return NextResponse.json(null) // Promo not active
        }

        return NextResponse.json(config)
    } catch (error) {
        console.error('Promo fetch error:', error)
        return NextResponse.json(null)
    }
}
