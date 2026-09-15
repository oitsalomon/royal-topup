import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signSessionToken, ADMIN_COOKIE_NAME, isAdminRole } from '@/lib/auth'
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from '@/lib/rate-limiter'
import { loginSchema, sanitizeText } from '@/lib/validations'

export async function POST(request: Request) {
    // 1. Ekstrak IP klien untuk Rate Limiting
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

    // 2. Cek Rate Limiter (Maks 5 percobaan gagal per 15 menit)
    const rateCheck = checkLoginRateLimit(ip)
    if (!rateCheck.allowed) {
        return NextResponse.json({
            error: `Terlalu banyak percobaan login yang gagal. Akses dibatasi sementara. Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`
        }, { status: 429 })
    }

    try {
        const body = await request.json().catch(() => ({}))

        // 3. Validasi Input via Zod
        const validation = loginSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0]?.message || 'Input username atau password tidak valid.'
            }, { status: 400 })
        }

        const username = sanitizeText(validation.data.username)
        const password = validation.data.password

        // 4. Cari User di Database (Exact match lalu case-insensitive)
        let user = await prisma.user.findFirst({
            where: { username: { equals: username } },
            include: {
                gameIds: { include: { game: true } }
            }
        })

        if (!user) {
            user = await prisma.user.findFirst({
                where: { username: { equals: username, mode: 'insensitive' } },
                include: {
                    gameIds: { include: { game: true } }
                }
            })
        }

        // 5. Verifikasi Password
        if (!user || user.password !== password) {
            recordFailedLogin(ip)
            return NextResponse.json({
                error: 'Username atau password salah.'
            }, { status: 401 })
        }

        if (!user.isActive) {
            return NextResponse.json({
                error: 'Akun Anda dinonaktifkan. Silakan hubungi admin.'
            }, { status: 403 })
        }

        // Login Berhasil -> Reset Rate Limit untuk IP ini
        resetLoginAttempts(ip)

        // 6. Update last login & log aktivitas (non-blocking)
        prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        }).catch(() => {})

        prisma.activityLog.create({
            data: {
                user_id: user.id,
                action: 'LOGIN',
                details: `User ${user.username} login successfully`,
                ip_address: ip
            }
        }).catch(() => {})

        // 7. Work Session CS & Admin Tracking
        const isAdmin = isAdminRole(user.role)
        let workSessionData: { id: number; started_at: Date; isResumed: boolean } | null = null

        if (isAdmin) {
            // Cek apakah CS sudah memiliki sesi ACTIVE yang belum ditutup
            let activeSession = await prisma.workSession.findFirst({
                where: { user_id: user.id, status: 'ACTIVE' },
                orderBy: { started_at: 'desc' }
            })

            let isResumed = false
            if (activeSession) {
                isResumed = true
            } else {
                activeSession = await prisma.workSession.create({
                    data: {
                        user_id: user.id,
                        status: 'ACTIVE',
                        started_at: new Date(),
                        ip_address: ip
                    }
                })
            }

            workSessionData = {
                id: activeSession.id,
                started_at: activeSession.started_at,
                isResumed
            }
        }

        // 8. Siapkan Response
        const userResponse = {
            id: user.id,
            username: user.username,
            role: user.role,
            level: user.level,
            total_exp: user.total_exp,
            bank_name: user.bank_name,
            account_number: user.account_number,
            loyalty_points: user.loyalty_points,
            referral_code: user.referral_code,
            balance_bonus: user.balance_bonus,
            whatsapp: user.whatsapp,
            permissions: user.permissions,
            theme_preference: (user as any).theme_preference || 'DARK',
            workSession: workSessionData,
            gameIds: (user as any).gameIds,
            token: 'authenticated'
        }

        const response = NextResponse.json(userResponse)

        // 9. Jika Admin/Staff/CS/Viewer, terbitkan cryptographic httpOnly cookie & session cookie
        if (isAdmin) {
            const token = await signSessionToken({
                id: user.id,
                username: user.username,
                role: user.role
            }, 86400) // 24 jam

            response.cookies.set(ADMIN_COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 86400
            })

            if (workSessionData) {
                response.cookies.set('cs_work_session_id', String(workSessionData.id), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 86400
                })
            }

            response.cookies.set('rc_admin_theme', (user as any).theme_preference || 'DARK', {
                path: '/',
                maxAge: 31536000,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            })
        }

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan sistem saat proses login.' }, { status: 500 })
    }
}
