import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Lewati halaman login admin
    if (pathname === '/admin/login') {
        // Jika sudah punya session valid, arahkan ke dashboard
        const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
        const session = await verifySessionToken(token)
        if (session && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.role)) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
        return NextResponse.next()
    }

    // 2. Proteksi Halaman Admin: /admin/*
    const isAdminPage = pathname.startsWith('/admin')
    // Proteksi Endpoint Internal & Admin API: /api/admin/*, /api/internal/*
    const isAdminApi = pathname.startsWith('/api/admin') || pathname.startsWith('/api/internal')

    if (isAdminPage || isAdminApi) {
        const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
        const session = await verifySessionToken(token)

        const isAuthorized = session && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.role)

        if (!isAuthorized) {
            if (isAdminApi) {
                return NextResponse.json(
                    { error: 'Unauthorized: Akses ditolak. Sesi admin tidak valid atau telah kadaluarsa.' },
                    { status: 401 }
                )
            } else {
                const loginUrl = new URL('/admin/login', request.url)
                loginUrl.searchParams.set('redirect', pathname)
                return NextResponse.redirect(loginUrl)
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
        '/api/internal/:path*'
    ]
}
