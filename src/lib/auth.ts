import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

export { ADMIN_COOKIE_NAME, ADMIN_ROLES, isAdminRole, type AdminRole } from './auth-constants'
import { ADMIN_COOKIE_NAME, ADMIN_ROLES, isAdminRole } from './auth-constants'

export interface SessionPayload {
    id: number
    username: string
    role: string
    exp?: number
}

/**
 * Validasi dan ambil secret key untuk HMAC-SHA256 signing.
 * Wajib diset di environment / .env, tidak ada fallback ke DATABASE_URL atau hardcoded salt!
 */
function getAuthSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.trim().length === 0) {
        throw new Error('AUTH_SECRET environment variable is missing. Set AUTH_SECRET in your environment or .env file.')
    }
    return new TextEncoder().encode(secret)
}

/**
 * Buat cryptographic HMAC-SHA256 signed JWT token menggunakan jose (Edge Runtime & Node.js compatible)
 */
export async function signSessionToken(payload: Omit<SessionPayload, 'exp'>, expiresInSeconds = 86400): Promise<string> {
    const secretKey = getAuthSecretKey()
    return await new SignJWT({
        id: payload.id,
        username: payload.username,
        role: payload.role,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${expiresInSeconds}s`)
        .sign(secretKey)
}

/**
 * Verifikasi HMAC signature dan masa berlaku token menggunakan jose (Edge Runtime & Node.js compatible)
 */
export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
    if (!token || typeof token !== 'string') return null

    try {
        const secretKey = getAuthSecretKey()
        const { payload } = await jwtVerify(token, secretKey, {
            algorithms: ['HS256'],
        })

        if (!payload.id || !payload.username || !payload.role) {
            return null
        }

        return {
            id: Number(payload.id),
            username: String(payload.username),
            role: String(payload.role),
            exp: payload.exp ? Number(payload.exp) : undefined,
        }
    } catch {
        return null
    }
}

/**
 * Ekstrak sesi admin dari request (bisa NextRequest atau standar Request)
 */
export async function getAdminSessionFromRequest(request: Request | NextRequest): Promise<SessionPayload | null> {
    let token: string | null = null

    // 1. Cek Cookie
    if ('cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
        token = (request as NextRequest).cookies.get(ADMIN_COOKIE_NAME)?.value || null
    } else {
        const cookieHeader = request.headers.get('cookie') || ''
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]*)`))
        if (match) token = match[1]
    }

    // 2. Cek Authorization Header jika ada
    if (!token) {
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim()
        }
    }

    if (!token) return null

    const session = await verifySessionToken(token)
    if (!session) return null

    if (!isAdminRole(session.role)) {
        return null
    }

    return session
}
