import { prisma } from '@/lib/prisma'

export async function getBanks() {
    return await prisma.paymentMethod.findMany({
        where: { type: { in: ['BANK', 'EWALLET'] } }, // Fetch all banks/ewallets
        orderBy: { name: 'asc' }
    })
}

export async function getGamesForSelection() {
    return await prisma.game.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    })
}
