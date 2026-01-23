import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const result = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size;`
        console.log('Database Size:', result)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
