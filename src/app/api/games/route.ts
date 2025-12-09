import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        let games = await prisma.game.findMany({
            orderBy: { createdAt: 'desc' }
        })

        // Lazy Seed: If no games found, create them (Logic for Vercel/SQLite persistence)
        if (games.length === 0) {
            console.log('No games found, seeding default games...')
            const defaultGames = [
                { name: 'Royal Aqua', code: 'ROYAL_AQUA', image: '/images/royal-aqua.png', category: 'GAMES', isActive: true },
                { name: 'Neo Party', code: 'NEO_PARTY', image: '/images/neo-party.png', category: 'GAMES', isActive: true },
                { name: 'Aqua Gacor', code: 'AQUA_GACOR', image: '/images/aqua-gacor.png', category: 'GAMES', isActive: true },
                { name: 'Royal Dream', code: 'ROYAL_DREAM', image: '/images/royal-dream.png', category: 'GAMES', isActive: true },
            ]

            for (const g of defaultGames) {
                await prisma.game.create({ data: g })
            }

            // Refetch after seeding
            games = await prisma.game.findMany({
                orderBy: { createdAt: 'desc' }
            })
        }

        return NextResponse.json(games)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, code, image, category, externalUrl, isActive } = body

        const game = await prisma.game.create({
            data: {
                name,
                code,
                image,
                category: category || 'GAMES',
                externalUrl,
                isActive: isActive ?? true
            }
        })
        return NextResponse.json(game)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, code, image, category, externalUrl, isActive } = body

        const game = await prisma.game.update({
            where: { id: Number(id) },
            data: {
                name,
                code,
                image,
                category,
                externalUrl,
                isActive
            }
        })
        return NextResponse.json(game)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.game.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
    }
}
