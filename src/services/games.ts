import { prisma } from '@/lib/prisma'

export interface Game {
    id?: number
    name: string
    code: string
    image: string
    category: string
    isActive: boolean
    externalUrl?: string | null
    store_name?: string | null
    createdAt?: Date
    updatedAt?: Date
}

export async function getGames(activeOnly: boolean = false) {
    try {
        let games = await prisma.game.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                code: true,
                category: true,
                isActive: true,
                externalUrl: true,
                store_name: true,
                createdAt: true,
                updatedAt: true,
                image: true
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

        return games
    } catch (error) {
        console.error('Error fetching games:', error)
        throw new Error('Failed to fetch games')
    }
}

export async function createGame(data: Game, userId: number) {
    try {
        const game = await prisma.game.create({
            data: {
                name: data.name,
                code: data.code,
                image: data.image,
                category: data.category || 'GAMES',
                externalUrl: data.externalUrl,
                store_name: data.store_name,
                isActive: data.isActive ?? true
            }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_GAME',
                details: `Created game: ${data.name} (${data.code})`
            }
        })

        return game
    } catch (error) {
        console.error('Error creating game:', error)
        throw error
    }
}

export async function updateGame(id: number, data: Game, userId: number) {
    try {
        const game = await prisma.game.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                image: data.image,
                category: data.category,
                externalUrl: data.externalUrl,
                store_name: data.store_name,
                isActive: data.isActive
            }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_GAME',
                details: `Updated game ${game.name}`
            }
        })

        return game
    } catch (error) {
        console.error('Error updating game:', error)
        throw error
    }
}

export async function deleteGame(id: number, userId: number) {
    try {
        const deletedGame = await prisma.game.delete({
            where: { id }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'DELETE_GAME',
                details: `Deleted game: ${deletedGame.name}`
            }
        })

        return true
    } catch (error) {
        console.error('Error deleting game:', error)
        throw error
    }
}
