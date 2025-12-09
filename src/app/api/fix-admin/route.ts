import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const admin = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {
                password: 'admin123',
                role: 'ADMIN',
                isActive: true
            },
            create: {
                username: 'admin',
                password: 'admin123',
                role: 'ADMIN',
                balance_money: 1000000,
                balance_chip: 1000000,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Admin password reset to: admin123',
            user: admin
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
