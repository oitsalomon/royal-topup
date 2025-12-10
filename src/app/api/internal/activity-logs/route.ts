import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = Number(searchParams.get('page')) || 1
        const limit = Number(searchParams.get('limit')) || 20
        const skip = (page - 1) * limit

        const search = searchParams.get('search')
        const user_id = searchParams.get('user_id')
        const date = searchParams.get('date')
        const action = searchParams.get('action')

        const where: any = {}

        if (user_id && user_id !== 'all') {
            where.user_id = Number(user_id)
        }

        if (action && action !== 'all') {
            where.action = action
        }

        if (date) {
            const startDate = new Date(date)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(date)
            endDate.setHours(23, 59, 59, 999)
            where.createdAt = {
                gte: startDate,
                lte: endDate
            }
        }

        if (search) {
            where.details = {
                contains: search,
                mode: 'insensitive'
            }
        }

        const [logs, total] = await prisma.$transaction([
            prisma.activityLog.findMany({
                where,
                include: { user: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.activityLog.count({ where })
        ])

        return NextResponse.json({
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Logs fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
    }
}
