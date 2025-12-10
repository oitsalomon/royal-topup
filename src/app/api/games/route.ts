import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function GET() {
    try {
        let games = await prisma.game.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                code: true,
                category: true,
                isActive: true,
                externalUrl: true,
                createdAt: true,
                updatedAt: true,
                // image: false // Exclude heavy image data to prevent Vercel Function Timeout
            }
        })

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
        const userId = getUserId(request)

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

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_GAME',
                details: `Created game: ${name} (${code})`
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
        const userId = getUserId(request)

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

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_GAME',
                details: `Updated game ${game.name}`
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
        const userId = getUserId(request)

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const deletedGame = await prisma.game.delete({
            where: { id: Number(id) }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'DELETE_GAME',
                details: `Deleted game: ${deletedGame.name}`
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
    }
}
