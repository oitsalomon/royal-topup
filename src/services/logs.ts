import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface GetLogsParams {
    page?: number
    limit?: number
    search?: string
    date?: string
    user_id?: string
    action?: string
}

export async function getActivityLogs({
    page = 1,
    limit = 20,
    search = '',
    date = '',
    user_id = 'all',
    action = 'all'
}: GetLogsParams) {
    const skip = (page - 1) * limit

    // Build filter
    const whereClause: Prisma.ActivityLogWhereInput = {}

    if (search) {
        whereClause.details = { contains: search, mode: 'insensitive' }
    }

    if (date) {
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        whereClause.createdAt = {
            gte: startDate,
            lte: endDate
        }
    }

    if (user_id !== 'all') {
        whereClause.user_id = parseInt(user_id)
    }

    if (action !== 'all') {
        whereClause.action = action
    }

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: { user: { select: { username: true } } }
        }),
        prisma.activityLog.count({ where: whereClause })
    ])

    return {
        data: logs,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}

export async function getStaffList() {
    return await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'STAFF'] } },
        select: { id: true, username: true }
    })
}
