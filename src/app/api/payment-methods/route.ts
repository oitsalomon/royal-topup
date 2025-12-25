import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const gameCode = searchParams.get('gameCode')

        const totalCount = await prisma.paymentMethod.count()
        if (totalCount === 0) {
            // Seed defaults logic omitted for brevity, assuming already seeded or handled
        }

        // Filter Logic:
        // 1. Must be Active
        // 2. IF gameCode provided:
        //    - Show banks with NO specific game links (Global)
        //    - OR Show banks linked to THIS gameCode

        let whereCondition: any = { isActive: true }

        if (gameCode) {
            whereCondition = {
                isActive: true,
                OR: [
                    { games: { none: {} } }, // Global (No specific games)
                    { games: { some: { code: gameCode } } } // Specific to this game
                ]
            }
        }

        const methods = await prisma.paymentMethod.findMany({
            where: whereCondition,
            orderBy: { id: 'asc' }
        })

        return NextResponse.json(methods)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
    }
}
