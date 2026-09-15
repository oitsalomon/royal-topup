import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/auth'
import { resolveAdminUser, getClientIp } from '@/lib/session-helper'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const closeShift = Boolean(body?.closeShift)
        const user = await resolveAdminUser(request)
        const ip = getClientIp(request)

        if (user && closeShift) {
            // Tutup sesi aktif milik user ini
            const activeSession = await prisma.workSession.findFirst({
                where: { user_id: user.id, status: 'ACTIVE' },
                orderBy: { started_at: 'desc' }
            })

            if (activeSession) {
                await prisma.workSession.update({
                    where: { id: activeSession.id },
                    data: {
                        status: 'CLOSED',
                        ended_at: new Date()
                    }
                })

                await prisma.activityLog.create({
                    data: {
                        user_id: user.id,
                        work_session_id: activeSession.id,
                        action: 'SHIFT_CLOSED',
                        details: `CS ${user.username} menutup shift kerja (ID Sesi: ${activeSession.id})`,
                        ip_address: ip
                    }
                }).catch(() => {})
            }
        } else if (user) {
            // Hanya logout tanpa menutup shift
            await prisma.activityLog.create({
                data: {
                    user_id: user.id,
                    action: 'LOGOUT',
                    details: `CS ${user.username} logout dari panel (shift tetap aktif)`,
                    ip_address: ip
                }
            }).catch(() => {})
        }

        const response = NextResponse.json({ success: true, message: 'Berhasil logout' })
        response.cookies.set(ADMIN_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0
        })
        response.cookies.set('cs_work_session_id', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0
        })
        return response
    } catch (error) {
        console.error('Logout error:', error)
        const response = NextResponse.json({ success: true, message: 'Berhasil logout' })
        response.cookies.set(ADMIN_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0
        })
        return response
    }
}
