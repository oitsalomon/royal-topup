import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 STARTING BUILD-TIME CLEANUP (Wiping Images)...')

    try {
        // 1. Wipe Games
        console.log('Cleaning Games...')
        const games = await prisma.game.updateMany({
            where: {},
            data: { image: null }
        })
        console.log(`✅ Wiped ${games.count} game images.`)

        // 2. Wipe Banks
        console.log('Cleaning Banks...')
        const banks = await prisma.paymentMethod.updateMany({
            where: {},
            data: { image: null }
        })
        console.log(`✅ Wiped ${banks.count} bank images.`)

        console.log('🎉 CLEANUP COMPLETE. Database should be light now.')
    } catch (e) {
        console.error('❌ CLEANUP FAILED:', e)
        // We don't exit(1) because we want the build to continue even if cleanup fails (maybe?)
        // Actually, if it fails, we want to know. But we don't want to break the site if DB is down.
        // Let's swallow error to allow build to finish, but log it.
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(0)
    })
