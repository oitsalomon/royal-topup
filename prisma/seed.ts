import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: 'admin123', // Force reset password
    },
    create: {
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
      balance_money: 1000000,
      balance_chip: 1000000,
    },
  })
  console.log({ admin })

  // Create Games
  const games = [
    { name: 'Royal Aqua', code: 'ROYAL_AQUA', image: '/images/royal-aqua.png' },
    { name: 'Neo Party', code: 'NEO_PARTY', image: '/images/neo-party.png' },
    { name: 'Aqua Gacor', code: 'AQUA_GACOR', image: '/images/aqua-gacor.png' },
    { name: 'Royal Dream', code: 'ROYAL_DREAM', image: '/images/royal-dream.png' },
  ]

  for (const game of games) {
    await prisma.game.upsert({
      where: { code: game.code },
      update: {},
      create: game,
    })
  }

  // Create Payment Methods
  const paymentMethods = [
    { name: 'BCA', type: 'BANK', account_number: '1234567890', account_name: 'Aqua Store' },
    { name: 'Mandiri', type: 'BANK', account_number: '0987654321', account_name: 'Aqua Store' },
    { name: 'DANA', type: 'EWALLET', account_number: '081234567890', account_name: 'Aqua Store' },
    { name: 'OVO', type: 'EWALLET', account_number: '081234567891', account_name: 'Aqua Store' },
    { name: 'QRIS', type: 'EWALLET', account_number: '-', account_name: 'Aqua Store' },
  ]

  for (const pm of paymentMethods) {
    await prisma.paymentMethod.create({
      data: pm,
    })
  }

  // Create Packages
  const packages = [
    { name: '120 M', chip: 120, price: 10000 },
    { name: '170 M', chip: 170, price: 15000 },
    { name: '250 M', chip: 250, price: 20000 },
    { name: '350 M', chip: 350, price: 25000 },
    { name: '400 M', chip: 400, price: 30000 },
    { name: '500 M', chip: 500, price: 32500 },
    { name: '530 M', chip: 530, price: 35000 },
    { name: '600 M', chip: 600, price: 40000 },
    { name: '650 M', chip: 650, price: 45000 },
    { name: '750 M', chip: 750, price: 50000 },
    { name: '800 M', chip: 800, price: 55000 },
    { name: '900 M', chip: 900, price: 60000 },
    { name: '1 B', chip: 1000, price: 65000 },
  ]

  for (const pkg of packages) {
    await prisma.package.create({
      data: pkg
    })
  }

  // Create Withdraw Methods (Supported Destinations)
  const withdrawMethods = [
    { name: 'BCA', type: 'BANK' },
    { name: 'BRI', type: 'BANK' },
    { name: 'Mandiri', type: 'BANK' },
    { name: 'BNI', type: 'BANK' },
    { name: 'DANA', type: 'EWALLET' },
    { name: 'GOPAY', type: 'EWALLET' },
    { name: 'OVO', type: 'EWALLET' },
    { name: 'SHOPEEPAY', type: 'EWALLET' },
  ]

  for (const wm of withdrawMethods) {
    await prisma.withdrawMethod.create({
      data: wm
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
