import { NextResponse } from 'next/server'
import { getAdminSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const session = await getAdminSessionFromRequest(request)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized: Sesi tidak ditemukan' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                id: true,
                username: true,
                role: true,
                level: true,
                whatsapp: true,
                isActive: true
            }
        })

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Unauthorized: Akun dinonaktifkan' }, { status: 403 })
        }

        return NextResponse.json({
            id: user.id,
            username: user.username,
            role: user.role,
            level: user.level,
            whatsapp: user.whatsapp,
            token: 'authenticated'
        })
    } catch (error) {
        console.error('Session sync error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
