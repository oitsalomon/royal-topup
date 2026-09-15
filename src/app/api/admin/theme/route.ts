import { NextResponse } from 'next/server'
import { resolveAdminUser } from '@/lib/session-helper'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const user = await resolveAdminUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: Sesi admin tidak ditemukan' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const theme = body.theme?.toUpperCase()
        if (!['DARK', 'LIGHT', 'SYSTEM'].includes(theme)) {
            return NextResponse.json({ error: 'Tema tidak valid. Pilihan: DARK, LIGHT, SYSTEM' }, { status: 400 })
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { theme_preference: theme }
        })

        const res = NextResponse.json({ success: true, theme })
        res.cookies.set('rc_admin_theme', theme, {
            path: '/',
            maxAge: 31536000, // 1 year
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        })

        return res
    } catch (error: any) {
        console.error('Error saving theme preference:', error)
        return NextResponse.json({ error: 'Gagal menyimpan preferensi tema' }, { status: 500 })
    }
}
