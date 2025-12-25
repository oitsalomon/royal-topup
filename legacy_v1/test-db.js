
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Testing DB connection...')
    try {
        const count = await prisma.dcBos.count()
        console.log('Connection successful. DcBos count:', count)
        const items = await prisma.dcBos.findMany({ take: 1 })
        console.log('First item:', items[0])
    } catch (e) {
        console.error('DB Error:', e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
