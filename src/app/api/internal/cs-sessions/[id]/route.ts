import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser } from '@/lib/session-helper'
import { formatJakartaDisplay, getJakartaTimeString } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const sessionId = parseInt(id, 10)
        if (isNaN(sessionId)) {
            return NextResponse.json({ error: 'ID sesi tidak valid' }, { status: 400 })
        }

        const user = await resolveAdminUser(request)
        const isMaster = user.role === 'SUPER_ADMIN' || user.role === 'OWNER' || user.username?.toLowerCase() === 'salomon'

        const session = await prisma.workSession.findUnique({
            where: { id: sessionId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }
                },
                transactions: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        trx_id: true,
                        type: true,
                        status: true,
                        amount_money: true,
                        amount_chip: true,
                        user_game_id: true,
                        nickname: true,
                        sender_name: true,
                        target_payment_details: true,
                        createdAt: true,
                        paymentMethod: { select: { name: true } },
                        withdrawMethod: { select: { name: true } }
                    }
                },
                transfers: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        amount: true,
                        type: true,
                        note: true,
                        createdAt: true,
                        fromBank: { select: { name: true, account_number: true } },
                        toBank: { select: { name: true, account_number: true } },
                        fromGameAccount: { select: { username: true } },
                        toGameAccount: { select: { username: true } }
                    }
                },
                adjustments: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        amount: true,
                        type: true,
                        reason: true,
                        createdAt: true,
                        bank: { select: { name: true, account_number: true } },
                        gameAccount: { select: { username: true } }
                    }
                },
                operationalExpenses: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        category: true,
                        description: true,
                        amount: true,
                        bank_name: true,
                        createdAt: true
                    }
                },
                dcBos: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        amount: true,
                        bank_name: true,
                        note: true,
                        createdAt: true
                    }
                },
                activityLogs: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        action: true,
                        details: true,
                        ip_address: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!session) {
            return NextResponse.json({ error: 'Sesi kerja tidak ditemukan' }, { status: 404 })
        }

        // Pembatasan akses: CS hanya boleh melihat sesinya sendiri
        if (!isMaster && session.user_id !== user.id) {
            return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin melihat sesi staff lain' }, { status: 403 })
        }

        // a. Transaksi — breakdown per bank
        const bankBreakdownMap: Record<string, { bank: string; count: number; totalMoney: number }> = {}
        for (const t of session.transactions) {
            if (t.status === 'APPROVED_2') {
                const bank = t.paymentMethod?.name || t.withdrawMethod?.name || 'Lainnya'
                if (!bankBreakdownMap[bank]) {
                    bankBreakdownMap[bank] = { bank, count: 0, totalMoney: 0 }
                }
                bankBreakdownMap[bank].count++
                bankBreakdownMap[bank].totalMoney += t.amount_money || 0
            }
        }
        const bankBreakdown = Object.values(bankBreakdownMap).sort((a, b) => b.totalMoney - a.totalMoney)

        // b. Transfer Bank
        const transfersFormatted = session.transfers.map(tr => ({
            id: tr.id,
            time: getJakartaTimeString(tr.createdAt),
            rawTime: tr.createdAt,
            from: tr.fromBank?.name ? `${tr.fromBank.name} (${tr.fromBank.account_number})` : tr.fromGameAccount?.username || '—',
            to: tr.toBank?.name ? `${tr.toBank.name} (${tr.toBank.account_number})` : tr.toGameAccount?.username || '—',
            amount: tr.amount,
            type: tr.type,
            note: tr.note || '—'
        }))

        // c. Adjustment
        const adjustmentsFormatted = session.adjustments.map(adj => {
            const targetName = adj.bank?.name ? `${adj.bank.name} (${adj.bank.account_number})` : adj.gameAccount?.username || '—'
            return {
                id: adj.id,
                time: getJakartaTimeString(adj.createdAt),
                rawTime: adj.createdAt,
                target: targetName,
                type: adj.type,
                action: 'ADJUST',
                amount_money: adj.type === 'MONEY' ? adj.amount : null,
                amount_chip: adj.type === 'CHIP' ? adj.amount : null,
                reason: adj.reason || '—',
                ip_address: '—'
            }
        })

        // d. Biaya Operasional
        const expensesFormatted = session.operationalExpenses.map(exp => ({
            id: exp.id,
            time: getJakartaTimeString(exp.createdAt),
            rawTime: exp.createdAt,
            category: exp.category,
            description: exp.description,
            amount: exp.amount,
            bank_name: exp.bank_name || '—'
        }))

        // e. DC Bos / Setoran
        const dcBosFormatted = session.dcBos.map(dc => ({
            id: dc.id,
            time: getJakartaTimeString(dc.createdAt),
            rawTime: dc.createdAt,
            amount: dc.amount,
            toBank: dc.bank_name || '—',
            note: dc.note || '—'
        }))

        // f. Timeline Kronologis
        const timelineEvents: any[] = []

        // Activity Logs
        for (const log of session.activityLogs) {
            timelineEvents.push({
                category: 'ACTIVITY',
                rawTime: log.createdAt,
                time: getJakartaTimeString(log.createdAt),
                timeDisplay: formatJakartaDisplay(log.createdAt),
                action: log.action,
                detail: log.details || '—',
                ip: log.ip_address || '—'
            })
        }

        // Transactions
        for (const tr of session.transactions) {
            timelineEvents.push({
                category: 'TRANSACTION',
                rawTime: tr.createdAt,
                time: getJakartaTimeString(tr.createdAt),
                timeDisplay: formatJakartaDisplay(tr.createdAt),
                action: `${tr.type} (${tr.status})`,
                detail: `ID: ${tr.trx_id} · Member: ${tr.user_game_id || tr.nickname || tr.sender_name || '—'} · Rp ${(tr.amount_money || 0).toLocaleString('id-ID')} · ${tr.paymentMethod?.name || tr.withdrawMethod?.name || '—'}`,
                ip: '—'
            })
        }

        // Transfers
        for (const tr of session.transfers) {
            timelineEvents.push({
                category: 'TRANSFER',
                rawTime: tr.createdAt,
                time: getJakartaTimeString(tr.createdAt),
                timeDisplay: formatJakartaDisplay(tr.createdAt),
                action: `TRANSFER_${tr.type}`,
                detail: `${tr.fromBank?.name || tr.fromGameAccount?.username || '—'} -> ${tr.toBank?.name || tr.toGameAccount?.username || '—'} (Rp ${(tr.amount || 0).toLocaleString('id-ID')}) · ${tr.note || '—'}`,
                ip: '—'
            })
        }

        // Expenses
        for (const exp of session.operationalExpenses) {
            timelineEvents.push({
                category: 'EXPENSE',
                rawTime: exp.createdAt,
                time: getJakartaTimeString(exp.createdAt),
                timeDisplay: formatJakartaDisplay(exp.createdAt),
                action: `BIAYA (${exp.category})`,
                detail: `${exp.description} (Rp ${(exp.amount || 0).toLocaleString('id-ID')}) · Rek: ${exp.bank_name || '—'}`,
                ip: '—'
            })
        }

        // Adjustments
        for (const adj of session.adjustments) {
            const targetName = adj.bank?.name ? adj.bank.name : adj.gameAccount?.username || '—'
            const valStr = adj.type === 'MONEY' ? `Rp ${(adj.amount || 0).toLocaleString('id-ID')}` : `${adj.amount || 0}B`
            timelineEvents.push({
                category: 'ADJUSTMENT',
                rawTime: adj.createdAt,
                time: getJakartaTimeString(adj.createdAt),
                timeDisplay: formatJakartaDisplay(adj.createdAt),
                action: `ADJUSTMENT (${adj.type})`,
                detail: `Target: ${targetName} · ${valStr} · Alasan: ${adj.reason || '—'}`,
                ip: '—'
            })
        }

        // DC Bos
        for (const dc of session.dcBos) {
            timelineEvents.push({
                category: 'DCBOS',
                rawTime: dc.createdAt,
                time: getJakartaTimeString(dc.createdAt),
                timeDisplay: formatJakartaDisplay(dc.createdAt),
                action: 'SETORAN_DC_BOS',
                detail: `Setoran ke ${dc.bank_name || '—'} (Rp ${(dc.amount || 0).toLocaleString('id-ID')}) · ${dc.note || '—'}`,
                ip: '—'
            })
        }

        // Sort ascending by time
        timelineEvents.sort((a, b) => new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime())

        // Calculate totals and duration
        const topupTrx = session.transactions.filter(t => t.status === 'APPROVED_2' && t.type === 'TOPUP')
        const wdTrx = session.transactions.filter(t => t.status === 'APPROVED_2' && t.type === 'WITHDRAW')
        const declinedTrx = session.transactions.filter(t => t.status === 'DECLINED')

        const totalMoney = topupTrx.reduce((acc, t) => acc + (t.amount_money || 0), 0) +
                           wdTrx.reduce((acc, t) => acc + (t.amount_money || 0), 0)

        const totalChipB = topupTrx.reduce((acc, t) => acc + (t.amount_chip || 0), 0) +
                           wdTrx.reduce((acc, t) => acc + (t.amount_chip || 0), 0)

        const startTime = new Date(session.started_at).getTime()
        const endTime = session.ended_at ? new Date(session.ended_at).getTime() : Date.now()
        const durationMs = Math.max(0, endTime - startTime)
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

        return NextResponse.json({
            session: {
                id: session.id,
                user_id: session.user_id,
                cs_name: session.user.username,
                cs_role: session.user.role,
                started_at: session.started_at,
                started_at_display: formatJakartaDisplay(session.started_at),
                ended_at: session.ended_at,
                ended_at_display: session.ended_at ? formatJakartaDisplay(session.ended_at) : null,
                status: session.status,
                ip_address: session.ip_address || '—',
                durationFormatted: `${durationHours}j ${durationMinutes}m`,
                counts: {
                    total: session.transactions.length,
                    topup: topupTrx.length,
                    withdraw: wdTrx.length,
                    declined: declinedTrx.length
                },
                totals: {
                    money: totalMoney,
                    chip_B: totalChipB
                }
            },
            bankBreakdown,
            transfers: transfersFormatted,
            adjustments: adjustmentsFormatted,
            expenses: expensesFormatted,
            dcBos: dcBosFormatted,
            timeline: timelineEvents
        })
    } catch (error: any) {
        console.error('Error fetching session details:', error)
        return NextResponse.json({ error: 'Gagal mengambil detail sesi' }, { status: 500 })
    }
}

// Tutup sesi manual oleh Owner
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const sessionId = parseInt(id, 10)
        if (isNaN(sessionId)) {
            return NextResponse.json({ error: 'ID sesi tidak valid' }, { status: 400 })
        }

        const user = await resolveAdminUser(request)
        const isMaster = user.role === 'SUPER_ADMIN' || user.role === 'OWNER' || user.username?.toLowerCase() === 'salomon'
        if (!isMaster) {
            return NextResponse.json({ error: 'Hanya Owner / Master yang dapat menutup sesi staff secara manual' }, { status: 403 })
        }

        const session = await prisma.workSession.findUnique({
            where: { id: sessionId },
            include: { user: { select: { username: true } } }
        })

        if (!session) {
            return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
        }

        if (session.status !== 'ACTIVE') {
            return NextResponse.json({ error: `Sesi sudah dalam status ${session.status}` }, { status: 400 })
        }

        const endedAt = new Date()
        const updated = await prisma.workSession.update({
            where: { id: sessionId },
            data: {
                status: 'CLOSED',
                ended_at: endedAt
            }
        })

        await prisma.activityLog.create({
            data: {
                user_id: user.id,
                work_session_id: sessionId,
                action: 'MANUAL_CLOSE_SHIFT',
                details: `Owner ${user.username} menutup paksa shift CS ${session.user.username} (ID: ${sessionId})`,
                ip_address: 'Panel Owner'
            }
        }).catch(() => {})

        return NextResponse.json({
            success: true,
            message: `Shift CS ${session.user.username} berhasil ditutup`,
            session: updated
        })
    } catch (error: any) {
        console.error('Error closing session manually:', error)
        return NextResponse.json({ error: 'Gagal menutup sesi' }, { status: 500 })
    }
}
