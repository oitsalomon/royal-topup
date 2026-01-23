const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const games = await prisma.game.findMany(); console.log(games); } main();
