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
        const admin = await prisma.user.findFirst({
            where: { username: 'admin' },
            select: { id: true, username: true, role: true, password: true }
        })
        debugInfo.adminUser = admin || 'NOT FOUND'

    } catch (e: any) {
        debugInfo.prismaStatus = 'Error: ' + e.message
    }

    // 3. Check Database Write (Test)
    try {
        const test = await prisma.activityLog.create({
            data: {
                user_id: 1, // Dummy
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
