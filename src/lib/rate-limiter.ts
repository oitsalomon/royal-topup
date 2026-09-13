// In-memory rate limiter untuk login admin
// Maksimal 5 percobaan gagal per 15 menit per IP

interface RateLimitRecord {
    count: number
    resetTime: number
}

const loginAttempts = new Map<string, RateLimitRecord>()

const WINDOW_MS = 15 * 60 * 1000 // 15 menit
const MAX_ATTEMPTS = 5

export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
    const now = Date.now()
    const record = loginAttempts.get(ip)

    if (!record || now > record.resetTime) {
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 }
    }

    if (record.count >= MAX_ATTEMPTS) {
        const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
        return { allowed: false, remainingAttempts: 0, retryAfterSeconds }
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count, retryAfterSeconds: 0 }
}

export function recordFailedLogin(ip: string): void {
    const now = Date.now()
    const record = loginAttempts.get(ip)

    if (!record || now > record.resetTime) {
        loginAttempts.set(ip, {
            count: 1,
            resetTime: now + WINDOW_MS
        })
    } else {
        record.count += 1
    }
}

export function resetLoginAttempts(ip: string): void {
    loginAttempts.delete(ip)
}
