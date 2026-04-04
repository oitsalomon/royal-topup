
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const methods = await prisma.paymentMethod.findMany({
    select: { id: true, name: true, account_name: true, account_number: true }
  })
  console.log(JSON.stringify(methods, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
