import { prisma } from '@/lib/prisma'

export async function getGameAccounts() {
    return await prisma.gameAccount.findMany({
        orderBy: { isActive: 'desc' }, // Active likely first
        include: {
            game: {
                select: { name: true, code: true }
            }
        }
    })
}
