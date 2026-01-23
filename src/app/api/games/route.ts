import { NextResponse } from 'next/server'
import { getGames, createGame, updateGame, deleteGame, Game } from '@/services/games'

export const dynamic = 'force-dynamic'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function GET() {
    try {
        const games = await getGames()
        return NextResponse.json(games)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const userId = getUserId(request)
        const game = await createGame(body, userId)
        return NextResponse.json(game)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, ...data } = body
        const userId = getUserId(request)
        const game = await updateGame(Number(id), data as Game, userId)
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

        await deleteGame(Number(id), userId)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
    }
}
