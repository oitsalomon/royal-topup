
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const games = await prisma.game.findMany()
    console.log('--- GAMES LIST ---')
    games.forEach(g => {
        console.log(`ID: ${g.id} | Name: "${g.name}" | Code: "${g.code}" | Active: ${g.isActive}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
