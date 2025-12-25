import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
    const debugInfo: any = {
        env: process.env.NODE_ENV,
        cwd: process.cwd(),
        filesInCwd: [],
        dbPath: process.env.DATABASE_URL,
        prismaStatus: 'Unknown',
        counts: {},
        testWrite: 'Not attempted',
        usersFound: []
    }

    // 1. Check File System
    try {
        debugInfo.filesInCwd = fs.readdirSync(process.cwd())

        // Try to find prisma directory
        if (fs.existsSync(path.join(process.cwd(), 'prisma'))) {
            debugInfo.prismaDir = fs.readdirSync(path.join(process.cwd(), 'prisma'))
        }
    } catch (e: any) {
        debugInfo.fsError = e.message
    }

    // 2. Check Database Read
    try {
        const userCount = await prisma.user.count()
        const gameCount = await prisma.game.count()
        const pkgCount = await prisma.package.count()

        debugInfo.counts = { userCount, gameCount, pkgCount }
        debugInfo.prismaStatus = 'Connected'

        // Check specifically for Admin
        let admin = await prisma.user.findFirst({
            where: { username: 'admin' },
            select: { id: true, username: true, role: true, password: true }
        })

        // AUTO-FIX: If Admin missing, create it
        if (!admin) {
            debugInfo.autoFixAdmin = 'Attempting to create admin...'
            try {
                admin = await prisma.user.create({
                    data: {
                        username: 'admin',
                        password: 'admin123',
                        role: 'ADMIN',
                        balance_money: 1000000,
                        balance_chip: 1000000,
                    },
                    select: { id: true, username: true, role: true, password: true }
                })
                debugInfo.autoFixAdminResult = 'Success'
            } catch (err: any) {
                debugInfo.autoFixAdminResult = 'Failed: ' + err.message
            }
        }

        debugInfo.adminUser = admin || 'NOT FOUND'

        // AUTO-FIX: If Games missing, create defaults
        if (gameCount === 0) {
            debugInfo.autoFixGames = 'Attempting to seed games...'
            const defaultGames = [
                { name: 'Royal Aqua', code: 'ROYAL_AQUA', image: '/images/royal-aqua.png', category: 'GAMES', isActive: true },
                { name: 'Neo Party', code: 'NEO_PARTY', image: '/images/neo-party.png', category: 'GAMES', isActive: true },
                { name: 'Aqua Gacor', code: 'AQUA_GACOR', image: '/images/aqua-gacor.png', category: 'GAMES', isActive: true },
                { name: 'Royal Dream', code: 'ROYAL_DREAM', image: '/images/royal-dream.png', category: 'GAMES', isActive: true },
            ]
            for (const g of defaultGames) {
                await prisma.game.create({ data: g })
            }
            debugInfo.autoFixGamesResult = 'Seeded ' + defaultGames.length + ' games'
        }

    } catch (e: any) {
        debugInfo.prismaStatus = 'Error: ' + e.message
    }

    // 3. Check Database Write (Test)
    try {
        const test = await prisma.activityLog.create({
            data: {
                user_id: 1, // Dummy (will fail if user 1 missing, but we sort of fixed it above)
                action: 'DEBUG_TEST',
                details: 'Testing write access'
            }
        })
        debugInfo.testWrite = 'Success (ID: ' + test.id + ')'
    } catch (e: any) {
        debugInfo.testWrite = 'Failed: ' + e.message
    }

    return NextResponse.json(debugInfo, { status: 200 })
}
