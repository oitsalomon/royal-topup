import { NextResponse } from 'next/server'
import membersData from '@/data/all_members_database.json'
import { getAdminSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const adminSession = await getAdminSessionFromRequest(request)
    if (!adminSession) {
        return NextResponse.json({
            error: 'Unauthorized: Data member hanya dapat diakses oleh admin terotentikasi.'
        }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const view = searchParams.get('view') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.max(10, Math.min(100, Number(searchParams.get('limit')) || 30))

    try {
        let list = [...(membersData as any[])]

        // B1: Date Range Filter from PostgreSQL
        const hasDateFilter = Boolean(startDate && endDate)
        let periodMap = new Map<string, { top_nom: number; top_chip: number; top_count: number; wd_nom: number; wd_chip: number; wd_count: number }>()
        let periodTopupTotalNom = 0
        let periodTopupTotalChip = 0
        let periodWdTotalNom = 0
        let periodWdTotalChip = 0
        let activePeriodMembers = 0

        if (hasDateFilter) {
            const start = new Date(startDate!)
            const end = new Date(endDate!)

            const [periodTxs, periodTopupAgg, periodWdAgg] = await Promise.all([
                prisma.transaction.groupBy({
                    by: ['user_wa', 'type'],
                    where: {
                        createdAt: { gte: start, lte: end },
                        status: { in: ['APPROVED', 'APPROVED_1', 'APPROVED_2', 'SUCCESS'] }
                    },
                    _sum: {
                        amount_money: true,
                        amount_chip: true
                    },
                    _count: {
                        id: true
                    }
                }),
                prisma.transaction.aggregate({
                    where: {
                        createdAt: { gte: start, lte: end },
                        type: 'TOPUP',
                        status: { in: ['APPROVED', 'APPROVED_1', 'APPROVED_2', 'SUCCESS'] }
                    },
                    _sum: { amount_money: true, amount_chip: true }
                }),
                prisma.transaction.aggregate({
                    where: {
                        createdAt: { gte: start, lte: end },
                        type: 'WITHDRAW',
                        status: { in: ['APPROVED', 'APPROVED_1', 'APPROVED_2', 'SUCCESS'] }
                    },
                    _sum: { amount_money: true, amount_chip: true }
                })
            ])

            periodTopupTotalNom = periodTopupAgg._sum.amount_money || 0
            periodTopupTotalChip = periodTopupAgg._sum.amount_chip || 0
            periodWdTotalNom = periodWdAgg._sum.amount_money || 0
            periodWdTotalChip = periodWdAgg._sum.amount_chip || 0

            for (const item of periodTxs) {
                const normWa = (item.user_wa || '').replace(/\D/g, '').replace(/^08/, '628')
                if (!normWa) continue
                const current = periodMap.get(normWa) || { top_nom: 0, top_chip: 0, top_count: 0, wd_nom: 0, wd_chip: 0, wd_count: 0 }
                if (item.type === 'TOPUP') {
                    current.top_nom += item._sum.amount_money || 0
                    current.top_chip += item._sum.amount_chip || 0
                    current.top_count += item._count.id || 0
                } else if (item.type === 'WITHDRAW') {
                    current.wd_nom += item._sum.amount_money || 0
                    current.wd_chip += item._sum.amount_chip || 0
                    current.wd_count += item._count.id || 0
                }
                periodMap.set(normWa, current)
            }

            activePeriodMembers = periodMap.size

            // Map each member to active period stats only
            list = list.map(m => {
                const normWa = (m.wa || '').replace(/\D/g, '').replace(/^08/, '628')
                const pData = periodMap.get(normWa)
                if (pData) {
                    return {
                        ...m,
                        top_nom: pData.top_nom,
                        top_chip: pData.top_chip,
                        top_count: pData.top_count,
                        wd_nom: pData.wd_nom,
                        wd_chip: pData.wd_chip,
                        wd_count: pData.wd_count,
                        net_nom: pData.top_nom - pData.wd_nom,
                        net_chip: pData.top_chip - pData.wd_chip,
                        has_period_activity: true
                    }
                } else {
                    return {
                        ...m,
                        top_nom: 0,
                        top_chip: 0,
                        top_count: 0,
                        wd_nom: 0,
                        wd_chip: 0,
                        wd_count: 0,
                        net_nom: 0,
                        net_chip: 0,
                        has_period_activity: false
                    }
                }
            })
        }

        // B2: Auto-Detect Input Search 2 Arah (Royal ID <-> WA <-> Nickname)
        if (q) {
            const cleanQ = q.replace(/\D/g, '')
            const isPhoneInput = cleanQ.length >= 8 && (q.startsWith('08') || q.startsWith('62') || q.startsWith('+62'))
            const normPhoneQ = cleanQ.replace(/^08/, '628')

            list = list.filter((m) => {
                const memberNormWa = (m.wa || '').replace(/\D/g, '').replace(/^08/, '628')
                // 1. Phone number match
                if (isPhoneInput && memberNormWa.includes(normPhoneQ)) {
                    return true
                }
                // 2. Royal ID / Game ID match
                const gameIds = String(m.game_ids || '')
                if (cleanQ.length >= 4 && gameIds.includes(cleanQ)) {
                    return true
                }
                // 3. Nickname or raw query match
                const nick = String(m.nick || '').toLowerCase()
                const rawWa = String(m.wa || '')
                return nick.includes(q.toLowerCase()) || rawWa.includes(q) || gameIds.includes(q)
            })
        }

        // Filter by segmentation view
        if (view === 'follow_up') {
            list = list.filter((m) => (m.days_since != null && m.days_since >= 14) || (m.top_count != null && m.top_count <= 2))
            list.sort((a, b) => (b.top_nom || 0) - (a.top_nom || 0) || (b.days_since || 0) - (a.days_since || 0))
        } else if (view === 'vip_dormant') {
            list = list.filter((m) => (m.top_nom >= 3000000 || m.tier === 'VIP') && (m.days_since == null || m.days_since >= 7))
            list.sort((a, b) => (b.top_nom || 0) - (a.top_nom || 0))
        } else if (view === 'rare_buyer') {
            list = list.filter((m) => m.top_count != null && m.top_count >= 1 && m.top_count <= 2)
            list.sort((a, b) => (b.top_nom || 0) - (a.top_nom || 0))
        } else if (view === 'top_buyer') {
            list.sort((a, b) => (b.top_count || 0) - (a.top_count || 0) || (b.top_nom || 0) - (a.top_nom || 0))
        } else if (view === 'top_wd') {
            list.sort((a, b) => (b.wd_count || 0) - (a.wd_count || 0) || (b.wd_nom || 0) - (a.wd_nom || 0))
        } else if (view === 'net_spender') {
            list.sort((a, b) => (b.net_nom || 0) - (a.net_nom || 0))
        } else {
            // 'all' default: by top deposit
            list.sort((a, b) => (b.top_nom || 0) - (a.top_nom || 0))
        }

        const total = list.length
        const totalPages = Math.ceil(total / limit)
        const startIndex = (page - 1) * limit
        const paginated = list.slice(startIndex, startIndex + limit)

        // Top 5 spenders in current view / period
        const top5 = [...list]
            .sort((a, b) => (b.top_nom || 0) - (a.top_nom || 0))
            .slice(0, 5)
            .map((m, idx) => ({
                rank: idx + 1,
                nick: m.nick || '—',
                wa: m.wa,
                game_ids: m.game_ids,
                top_nom: m.top_nom,
                top_chip: m.top_chip
            }))

        const allList = membersData as any[]
        const followUpCount = allList.filter(
            (m) => (m.days_since != null && m.days_since >= 14) || (m.top_count != null && m.top_count <= 2)
        ).length
        const vipDormantCount = allList.filter(
            (m) => (m.top_nom >= 3000000 || m.tier === 'VIP') && (m.days_since == null || m.days_since >= 7)
        ).length
        const rareBuyerCount = allList.filter(
            (m) => m.top_count != null && m.top_count >= 1 && m.top_count <= 2
        ).length

        return NextResponse.json({
            success: true,
            total,
            page,
            totalPages,
            members: paginated,
            top5,
            stats: {
                totalDatabase: allList.length,
                activeMembers: hasDateFilter ? activePeriodMembers : allList.length,
                totalFollowUp: followUpCount,
                totalVipFollowUp: vipDormantCount,
                totalRareBuyer: rareBuyerCount,
                totalTopNom: hasDateFilter ? periodTopupTotalNom : allList.reduce((a, m) => a + (m.top_nom || 0), 0),
                totalTopChip: hasDateFilter ? periodTopupTotalChip : allList.reduce((a, m) => a + (m.top_chip || 0), 0),
                totalWdNom: hasDateFilter ? periodWdTotalNom : allList.reduce((a, m) => a + (m.wd_nom || 0), 0),
                totalWdChip: hasDateFilter ? periodWdTotalChip : allList.reduce((a, m) => a + (m.wd_chip || 0), 0),
                netNom: hasDateFilter
                    ? (periodTopupTotalNom - periodWdTotalNom)
                    : allList.reduce((a, m) => a + ((m.top_nom || 0) - (m.wd_nom || 0)), 0),
                hasDateFilter
            }
        })
    } catch (error: any) {
        console.error('CRM Members API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch CRM members', details: error.message }, { status: 500 })
    }
}
