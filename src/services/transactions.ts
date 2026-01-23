import { prisma } from '@/lib/prisma'

interface GetTransactionsParams {
    status?: string | null
    type?: string | null
    bank_id?: string | null
    date?: string | null
    search?: string | null
    page?: number
    limit?: number
}

export async function getTransactions({
    status,
    type,
    bank_id,
    date,
    search,
    page = 1,
    limit = 20
}: GetTransactionsParams) {
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
        where.status = status

        // If filtering for UNPAID, only show recent ones (e.g. last 5 mins)
        // to prevent stuck notifications from abandoned transactions
        if (status === 'UNPAID') {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            where.createdAt = {
                gte: fiveMinutesAgo
            }
        }
    } else {
        where.status = { not: 'UNPAID' }
    }
    if (type && type !== 'all') {
        where.type = type
    } else {
        // Exclude REFERRAL_WD by default from the main list as per user request
        where.type = { not: 'REFERRAL_WD' }
    }

    if (bank_id && bank_id !== 'all') where.payment_method_id = Number(bank_id)

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
        where.OR = [
            { nickname: { contains: search, mode: 'insensitive' } },
            { user_game_id: { contains: search, mode: 'insensitive' } },
            { user_wa: { contains: search, mode: 'insensitive' } }
        ]
    }

    const [transactions, total] = await prisma.$transaction([
        prisma.transaction.findMany({
            where,
            include: {
                game: true,
                paymentMethod: true,
                withdrawMethod: true,
                user: {
                    select: {
                        username: true,
                        level: true,
                        bank_name: true,
                        account_number: true,
                        account_name: true,
                        gameIds: {
                            select: {
                                game_user_id: true,
                                nickname: true,
                                game_id: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: skip
        }),
        prisma.transaction.count({ where })
    ])

    return {
        data: transactions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}
