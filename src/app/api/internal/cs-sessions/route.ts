import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser, expireInactiveWorkSessions } from '@/lib/session-helper'
import { parseJakartaDateTime, getJakartaTodayRange } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const user = await resolveAdminUser(request)
        const isMaster = user.role === 'SUPER_ADMIN' || user.role === 'OWNER' || user.username?.toLowerCase() === 'salomon'

        // Lazy check: Otomatis tandai sesi idle >12 jam sebagai EXPIRED
        await expireInactiveWorkSessions().catch(() => {})

        const { searchParams } = new URL(request.url)
        const startDateStr = searchParams.get('startDate')
        const startTimeStr = searchParams.get('startTime') || '00:00'
        const endDateStr = searchParams.get('endDate')
        const endTimeStr = searchParams.get('endTime') || '23:59'
        const csUserId = searchParams.get('userId')
        const statusFilter = searchParams.get('status') // ACTIVE, CLOSED, EXPIRED, ALL
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        // Tentukan rentang waktu filter
        let startUTC: Date
        let endUTC: Date

        if (startDateStr && endDateStr) {
            startUTC = parseJakartaDateTime(startDateStr, startTimeStr)
            endUTC = new Date(parseJakartaDateTime(endDateStr, endTimeStr).getTime() + 59999)
        } else {
            const today = getJakartaTodayRange()
            startUTC = today.startUTC
            endUTC = today.endUTC
        }

        // Susun query filter
        const whereClause: any = {
            started_at: {
                gte: startUTC,
                lte: endUTC
            }
        }

        // Pembatasan akses: CS biasa HANYA bisa melihat sesinya sendiri, Owner/Master bisa melihat semua CS
        if (!isMaster) {
            whereClause.user_id = user.id
        } else if (csUserId && !isNaN(Number(csUserId))) {
            whereClause.user_id = Number(csUserId)
        }

        if (statusFilter && statusFilter !== 'ALL') {
            whereClause.status = statusFilter
        }

        const sessions = await prisma.workSession.findMany({
            where: whereClause,
            orderBy: { started_at: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }
                },
                transactions: {
                    select: {
                        id: true,
                        type: true,
                        status: true,
                        amount_money: true,
                        amount_chip: true,
                        createdAt: true
                    }
                },
                transfers: {
                    select: {
                        id: true,
                        amount: true,
                        createdAt: true
                    }
                },
                operationalExpenses: {
                    select: {
                        id: true,
                        amount: true,
                        createdAt: true
                    }
                },
                dcBos: {
                    select: {
                        id: true,
                        amount: true,
                        createdAt: true
                    }
                },
                adjustments: {
                    select: {
                        id: true
                    }
                },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                }
            }
        })

        const now = Date.now()

        // Format and aggregate each session server-side
        const formattedSessions = sessions.map((s) => {
            const topupTrx = s.transactions.filter(t => t.status === 'APPROVED_2' && t.type === 'TOPUP')
            const wdTrx = s.transactions.filter(t => t.status === 'APPROVED_2' && t.type === 'WITHDRAW')
            const declinedTrx = s.transactions.filter(t => t.status === 'DECLINED')
            const totalApproved = topupTrx.length + wdTrx.length

            const totalMoney = topupTrx.reduce((acc, t) => acc + (t.amount_money || 0), 0) +
                               wdTrx.reduce((acc, t) => acc + (t.amount_money || 0), 0)

            const totalChipB = topupTrx.reduce((acc, t) => acc + (t.amount_chip || 0), 0) +
                               wdTrx.reduce((acc, t) => acc + (t.amount_chip || 0), 0)

            // Durasi shift
            const startTime = new Date(s.started_at).getTime()
            const endTime = s.ended_at ? new Date(s.ended_at).getTime() : now
            const durationMs = Math.max(0, endTime - startTime)
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

            // Cek peringatan idle (>12 jam aktif tanpa aktivitas)
            const latestLogTime = s.activityLogs[0]?.createdAt ? new Date(s.activityLogs[0].createdAt).getTime() : startTime
            const isIdleWarning = s.status === 'ACTIVE' && (now - latestLogTime > 12 * 60 * 60 * 1000)

            return {
                id: s.id,
                user_id: s.user_id,
                cs_name: s.user.username,
                cs_role: s.user.role,
                started_at: s.started_at,
                ended_at: s.ended_at,
                status: s.status, // ACTIVE, CLOSED, EXPIRED
                ip_address: s.ip_address || '—',
                duration: {
                    hours: durationHours,
                    minutes: durationMinutes,
                    formatted: `${durationHours}j ${durationMinutes}m`
                },
                counts: {
                    total: s.transactions.length,
                    topup: topupTrx.length,
                    withdraw: wdTrx.length,
                    declined: declinedTrx.length,
                    transfers: s.transfers.length,
                    expenses: s.operationalExpenses.length,
                    dcBos: s.dcBos.length,
                    adjustments: s.adjustments.length
                },
                totals: {
                    money: totalMoney,
                    chip_B: totalChipB
                },
                isIdleWarning
            }
        })

        // Ambil juga daftar CS untuk opsi dropdown filter
        const csStaffList = await prisma.user.findMany({
            where: {
                role: { in: ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'STAFF', 'CS'] },
                isActive: true
            },
            select: { id: true, username: true, role: true },
            orderBy: { username: 'asc' }
        })

        return NextResponse.json({
            sessions: formattedSessions,
            staffList: csStaffList,
            currentUser: {
                id: user.id,
                username: user.username,
                isMaster
            }
        })
    } catch (error: any) {
        console.error('Error fetching CS work sessions:', error)
        return NextResponse.json({ error: 'Gagal memuat riwayat sesi kerja CS' }, { status: 500 })
    }
}
