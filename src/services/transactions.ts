import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface GetTransactionsParams {
    status?: string | null
    type?: string | null
    bank_id?: string | null
    date?: string | null
    startDate?: string | null
    endDate?: string | null
    search?: string | null
    page?: number
    limit?: number
    includeStats?: boolean
}

export interface PeriodStats {
    totalTopupNom: number
    totalTopupChip: number
    totalWdNom: number
    totalWdChip: number
    netNom: number
    netChip: number
    pendingCount: number
    top3Topup: { user_game_id: string; amount_money: number; nickname: string }[]
    top3Wd: { user_game_id: string; amount_money: number; nickname: string }[]
}

export async function getTransactions({
    status,
    type,
    bank_id,
    date,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
    includeStats = true
}: GetTransactionsParams) {
    const skip = (page - 1) * limit

    try {
        const conditions: Prisma.Sql[] = []

        if (status && status !== 'all') {
            if (status === 'APPROVED') {
                conditions.push(Prisma.sql`t.status IN ('APPROVED', 'APPROVED_1', 'APPROVED_2', 'SUCCESS')`)
            } else if (status === 'DECLINED') {
                conditions.push(Prisma.sql`t.status IN ('DECLINED', 'CANCELLED', 'REJECTED')`)
            } else if (status === 'UNPAID') {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
                conditions.push(Prisma.sql`t.status = 'UNPAID' AND t."createdAt" >= ${fiveMinutesAgo}`)
            } else {
                conditions.push(Prisma.sql`t.status = ${status}`)
            }
        } else {
            conditions.push(Prisma.sql`t.status != 'UNPAID'`)
        }

        if (type && type !== 'all') {
            conditions.push(Prisma.sql`t.type = ${type}`)
        } else {
            conditions.push(Prisma.sql`t.type != 'REFERRAL_WD'`)
        }

        if (bank_id && bank_id !== 'all') {
            conditions.push(Prisma.sql`t.payment_method_id = ${Number(bank_id)}`)
        }

        // Filter by Date Range
        const periodConditions: Prisma.Sql[] = []
        if (startDate && endDate) {
            const sDate = new Date(startDate)
            const eDate = new Date(endDate)
            conditions.push(Prisma.sql`t."createdAt" >= ${sDate} AND t."createdAt" <= ${eDate}`)
            periodConditions.push(Prisma.sql`t."createdAt" >= ${sDate} AND t."createdAt" <= ${eDate}`)
        } else if (date) {
            const dStart = new Date(date)
            dStart.setHours(0, 0, 0, 0)
            const dEnd = new Date(date)
            dEnd.setHours(23, 59, 59, 999)
            conditions.push(Prisma.sql`t."createdAt" >= ${dStart} AND t."createdAt" <= ${dEnd}`)
            periodConditions.push(Prisma.sql`t."createdAt" >= ${dStart} AND t."createdAt" <= ${dEnd}`)
        }

        // Auto-detect Search Type
        if (search && search.trim()) {
            const s = `%${search.trim()}%`
            conditions.push(Prisma.sql`(
                t.trx_id ILIKE ${s} OR 
                t.nickname ILIKE ${s} OR 
                t.user_game_id ILIKE ${s} OR 
                t.user_wa ILIKE ${s}
            )`)
        }

        const whereClause = conditions.length > 0 
            ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
            : Prisma.empty

        const periodWhereClause = periodConditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(periodConditions, ' AND ')}`
            : Prisma.empty

        const periodDateAnd = periodConditions.length > 0
            ? Prisma.sql`AND ${Prisma.join(periodConditions, ' AND ')}`
            : Prisma.empty

        // Query 1: Single roundtrip rows + full count + relations via LEFT JOIN
        const queries: Promise<any>[] = [
            prisma.$queryRaw`
                SELECT 
                  t.id, t.trx_id, t.user_wa, t.nickname, t.user_game_id, 
                  t.amount_chip, t.amount_money, t.type, t.status, t.proof_image, 
                  t.target_payment_details, t.sender_name, t."createdAt",
                  g.name AS game_name,
                  pm.name AS payment_method_name,
                  wm.name AS withdraw_method_name,
                  u.username, u.level,
                  count(*) OVER() AS full_count
                FROM "Transaction" t
                LEFT JOIN "Game" g ON t.game_id = g.id
                LEFT JOIN "PaymentMethod" pm ON t.payment_method_id = pm.id
                LEFT JOIN "PaymentMethod" wm ON t.withdraw_method_id = wm.id
                LEFT JOIN "User" u ON t.user_id = u.id
                ${whereClause}
                ORDER BY t."createdAt" DESC
                LIMIT ${limit} OFFSET ${skip};
            `
        ]

        if (includeStats) {
            queries.push(
                // 2. Aggregated totals in single SQL
                prisma.$queryRaw`
                    SELECT
                      COALESCE(SUM(CASE WHEN type = 'TOPUP' AND status IN ('APPROVED', 'APPROVED_2', 'SUCCESS') THEN amount_money ELSE 0 END), 0)::bigint AS "totalTopupNom",
                      COALESCE(SUM(CASE WHEN type = 'TOPUP' AND status IN ('APPROVED', 'APPROVED_2', 'SUCCESS') THEN amount_chip ELSE 0 END), 0)::float8 AS "totalTopupChip",
                      COALESCE(SUM(CASE WHEN type = 'WITHDRAW' AND status IN ('APPROVED', 'APPROVED_2', 'SUCCESS') THEN amount_money ELSE 0 END), 0)::bigint AS "totalWdNom",
                      COALESCE(SUM(CASE WHEN type = 'WITHDRAW' AND status IN ('APPROVED', 'APPROVED_2', 'SUCCESS') THEN amount_chip ELSE 0 END), 0)::float8 AS "totalWdChip",
                      (SELECT COUNT(*) FROM "Transaction" WHERE status = 'PENDING')::int AS "pendingCount"
                    FROM "Transaction" t
                    ${periodWhereClause};
                `,
                // 3. Top 3 Topup spenders
                prisma.$queryRaw`
                    SELECT user_game_id, SUM(amount_money)::bigint AS amount_money
                    FROM "Transaction" t
                    WHERE type = 'TOPUP' AND status IN ('APPROVED', 'APPROVED_2', 'SUCCESS') AND user_game_id != ''
                      ${periodDateAnd}
                    GROUP BY user_game_id
                    ORDER BY amount_money DESC
                    LIMIT 3;
                `,
                // 4. Top 3 Withdraw
                prisma.$queryRaw`
                    SELECT user_game_id, SUM(amount_money)::bigint AS amount_money
                    FROM "Transaction" t
                    WHERE type = 'WITHDRAW' AND status IN ('APPROVED', 'APPROVED_2', 'SUCCESS') AND user_game_id != ''
                      ${periodDateAnd}
                    GROUP BY user_game_id
                    ORDER BY amount_money DESC
                    LIMIT 3;
                `
            )
        }

        const results = await Promise.all(queries)
        const rows = results[0] as any[]
        const total = rows.length > 0 ? Number(rows[0].full_count) : 0

        const transactions = rows.map(r => ({
            id: r.id,
            trx_id: r.trx_id,
            user_wa: r.user_wa,
            nickname: r.nickname,
            user_game_id: r.user_game_id,
            amount_chip: Number(r.amount_chip),
            amount_money: Number(r.amount_money),
            type: r.type,
            status: r.status,
            proof_image: r.proof_image,
            target_payment_details: r.target_payment_details,
            sender_name: r.sender_name,
            createdAt: r.createdAt,
            game: { name: r.game_name || 'Game' },
            paymentMethod: r.payment_method_name ? { name: r.payment_method_name } : null,
            withdrawMethod: r.withdraw_method_name ? { name: r.withdraw_method_name } : null,
            user: r.username ? { username: r.username, level: r.level || 'GUEST' } : null
        }))

        let stats: PeriodStats | undefined = undefined
        if (includeStats) {
            const statsAgg = (results[1] as any[])?.[0]
            const top3Topup = (results[2] as any[]) || []
            const top3Wd = (results[3] as any[]) || []

            const totalTopupNom = Number(statsAgg?.totalTopupNom || 0)
            const totalTopupChip = Number(statsAgg?.totalTopupChip || 0)
            const totalWdNom = Number(statsAgg?.totalWdNom || 0)
            const totalWdChip = Number(statsAgg?.totalWdChip || 0)

            stats = {
                totalTopupNom,
                totalTopupChip,
                totalWdNom,
                totalWdChip,
                netNom: totalTopupNom - totalWdNom,
                netChip: totalTopupChip - totalWdChip,
                pendingCount: Number(statsAgg?.pendingCount || 0),
                top3Topup: top3Topup.map(t => ({
                    user_game_id: t.user_game_id,
                    amount_money: Number(t.amount_money || 0),
                    nickname: ''
                })),
                top3Wd: top3Wd.map(w => ({
                    user_game_id: w.user_game_id,
                    amount_money: Number(w.amount_money || 0),
                    nickname: ''
                }))
            }
        }

        return {
            data: transactions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            stats: stats || {
                totalTopupNom: 0,
                totalTopupChip: 0,
                totalWdNom: 0,
                totalWdChip: 0,
                netNom: 0,
                netChip: 0,
                pendingCount: 0,
                top3Topup: [],
                top3Wd: []
            }
        }
    } catch (rawError) {
        console.warn('Raw SQL query error, falling back to Prisma Client query:', rawError)

        // Lean Prisma Fallback
        const where: any = {}
        if (status && status !== 'all') {
            if (status === 'APPROVED') {
                where.status = { in: ['APPROVED', 'APPROVED_1', 'APPROVED_2', 'SUCCESS'] }
            } else if (status === 'DECLINED') {
                where.status = { in: ['DECLINED', 'CANCELLED', 'REJECTED'] }
            } else if (status === 'UNPAID') {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
                where.status = 'UNPAID'
                where.createdAt = { gte: fiveMinutesAgo }
            } else {
                where.status = status
            }
        } else {
            where.status = { not: 'UNPAID' }
        }

        if (type && type !== 'all') {
            where.type = type
        } else {
            where.type = { not: 'REFERRAL_WD' }
        }

        if (bank_id && bank_id !== 'all') {
            where.payment_method_id = Number(bank_id)
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        } else if (date) {
            const dStart = new Date(date)
            dStart.setHours(0, 0, 0, 0)
            const dEnd = new Date(date)
            dEnd.setHours(23, 59, 59, 999)
            where.createdAt = {
                gte: dStart,
                lte: dEnd
            }
        }

        if (search && search.trim()) {
            const s = search.trim()
            where.OR = [
                { trx_id: { contains: s, mode: 'insensitive' } },
                { nickname: { contains: s, mode: 'insensitive' } },
                { user_game_id: { contains: s, mode: 'insensitive' } },
                { user_wa: { contains: s, mode: 'insensitive' } }
            ]
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                select: {
                    id: true,
                    trx_id: true,
                    user_wa: true,
                    nickname: true,
                    user_game_id: true,
                    amount_chip: true,
                    amount_money: true,
                    type: true,
                    status: true,
                    proof_image: true,
                    target_payment_details: true,
                    createdAt: true,
                    game: { select: { name: true } },
                    paymentMethod: { select: { name: true } },
                    withdrawMethod: { select: { name: true } },
                    user: { select: { username: true, level: true } }
                },
                orderBy: { createdAt: 'desc' },
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
            },
            stats: {
                totalTopupNom: 0,
                totalTopupChip: 0,
                totalWdNom: 0,
                totalWdChip: 0,
                netNom: 0,
                netChip: 0,
                pendingCount: 0,
                top3Topup: [],
                top3Wd: []
            }
        }
    }
}
