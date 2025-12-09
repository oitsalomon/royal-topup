import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const accounts = await prisma.gameAccount.findMany({
            include: { game: true },
            orderBy: { isActive: 'desc' }
        })
        return NextResponse.json(accounts)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch game accounts' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { game_id, username, password, role, balance } = body

        const account = await prisma.gameAccount.create({
            data: {
                game_id: Number(game_id),
                username,
                password,
                role, // DEPOSIT, WITHDRAW, ALL, GUDANG
                balance: balance ? Number(balance) : 0,
                isActive: true
            }
        })

        return NextResponse.json(account)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create game account' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, game_id, username, password, role, balance, isActive } = body

        const account = await prisma.gameAccount.update({
            where: { id: Number(id) },
            data: {
                game_id: game_id ? Number(game_id) : undefined,
                username,
                password,
                role,
                balance: balance !== undefined ? Number(balance) : undefined,
                isActive: isActive !== undefined ? isActive : undefined
            }
        })

        return NextResponse.json(account)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update game account' }, { status: 500 })
    }
}
