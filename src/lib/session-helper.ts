import { prisma } from '@/lib/prisma'
import { getAdminSessionFromRequest } from '@/lib/auth'

export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    const realIp = request.headers.get('x-real-ip')
    if (realIp) return realIp.trim()
    const cfIp = request.headers.get('cf-connecting-ip')
    if (cfIp) return cfIp.trim()
    return '127.0.0.1'
}

export async function getActiveWorkSessionId(userId: number): Promise<number | null> {
    try {
        const active = await prisma.workSession.findFirst({
            where: { user_id: userId, status: 'ACTIVE' },
            orderBy: { started_at: 'desc' },
            select: { id: true }
        })
        return active?.id || null
    } catch {
        return null
    }
}

export async function resolveAdminUser(request: Request): Promise<{
    id: number
    username: string
    role: string
    work_session_id: number | null
}> {
    let session: any = null
    try {
        session = await getAdminSessionFromRequest(request)
    } catch {}

    if (session?.id) {
        let workSessionId = session.work_session_id || null
        if (!workSessionId) {
            workSessionId = await getActiveWorkSessionId(session.id)
        }
        return {
            id: session.id,
            username: session.username,
            role: session.role,
            work_session_id: workSessionId
        }
    }

    const headerId = request.headers.get('X-User-Id')
    if (headerId && !isNaN(Number(headerId))) {
        const uId = Number(headerId)
        const user = await prisma.user.findUnique({
            where: { id: uId },
            select: { id: true, username: true, role: true }
        })
        if (user) {
            const workSessionId = await getActiveWorkSessionId(user.id)
            return {
                id: user.id,
                username: user.username,
                role: user.role,
                work_session_id: workSessionId
            }
        }
    }

    // Default fallback to first active admin
    try {
        const fallback = await prisma.user.findFirst({
            where: { role: { in: ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'STAFF', 'CS'] } },
            select: { id: true, username: true, role: true }
        })
        if (fallback) {
            const workSessionId = await getActiveWorkSessionId(fallback.id)
            return {
                id: fallback.id,
                username: fallback.username,
                role: fallback.role,
                work_session_id: workSessionId
            }
        }
    } catch {}

    return {
        id: 1,
        username: 'Admin',
        role: 'OWNER',
        work_session_id: null
    }
}

/**
 * Otomatis menandai sesi ACTIVE yang tidak ada aktivitas > 12 jam sebagai EXPIRED.
 * ended_at diset ke timestamp aktivitas terakhir sesi tersebut.
 */
export async function expireInactiveWorkSessions(): Promise<number> {
    try {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)

        // Cari sesi ACTIVE yang dimulai lebih dari 12 jam lalu
        const activeSessions = await prisma.workSession.findMany({
            where: {
                status: 'ACTIVE',
                started_at: { lt: twelveHoursAgo }
            },
            include: {
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                },
                transfers: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                },
                adjustments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                },
                operationalExpenses: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                },
                dcBos: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                }
            }
        })

        let expiredCount = 0

        for (const session of activeSessions) {
            const timestamps: Date[] = [session.started_at]
            if (session.activityLogs[0]?.createdAt) timestamps.push(session.activityLogs[0].createdAt)
            if (session.transactions[0]?.createdAt) timestamps.push(session.transactions[0].createdAt)
            if (session.transfers[0]?.createdAt) timestamps.push(session.transfers[0].createdAt)
            if (session.adjustments[0]?.createdAt) timestamps.push(session.adjustments[0].createdAt)
            if (session.operationalExpenses[0]?.createdAt) timestamps.push(session.operationalExpenses[0].createdAt)
            if (session.dcBos[0]?.createdAt) timestamps.push(session.dcBos[0].createdAt)

            const latestActivity = new Date(Math.max(...timestamps.map(t => t.getTime())))
            const timeSinceLastActivity = Date.now() - latestActivity.getTime()

            if (timeSinceLastActivity > 12 * 60 * 60 * 1000) {
                await prisma.workSession.update({
                    where: { id: session.id },
                    data: {
                        status: 'EXPIRED',
                        ended_at: latestActivity
                    }
                })
                expiredCount++
            }
        }

        return expiredCount
    } catch (error) {
        console.error('Error expiring inactive sessions:', error)
        return 0
    }
}
