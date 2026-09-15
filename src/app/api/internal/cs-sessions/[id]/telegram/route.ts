import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser } from '@/lib/session-helper'
import { getJakartaTimeString, JAKARTA_TIMEZONE } from '@/lib/timezone'
import { sendCustomMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

function generateShiftReportText(session: any): string {
    const startDate = new Date(session.started_at)
    const endDate = session.ended_at ? new Date(session.ended_at) : new Date()

    // Tanggal dalam format Bahasa Indonesia (misal: "Minggu, 14 September 2026")
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: JAKARTA_TIMEZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(startDate)

    const startTimeStr = getJakartaTimeString(startDate)
    const endTimeStr = session.ended_at ? getJakartaTimeString(endDate) : 'Sekarang'

    // Hitung durasi
    const durationMs = Math.max(0, endDate.getTime() - startDate.getTime())
    const durHours = Math.floor(durationMs / (1000 * 60 * 60))
    const durMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    // Transaksi stats
    const topupTrx = session.transactions.filter((t: any) => t.status === 'APPROVED_2' && t.type === 'TOPUP')
    const wdTrx = session.transactions.filter((t: any) => t.status === 'APPROVED_2' && t.type === 'WITHDRAW')
    const declinedTrx = session.transactions.filter((t: any) => t.status === 'DECLINED')
    const totalTrxCount = session.transactions.length

    const totalMoney = topupTrx.reduce((acc: number, t: any) => acc + (t.amount_money || 0), 0) +
                       wdTrx.reduce((acc: number, t: any) => acc + (t.amount_money || 0), 0)

    const totalChipB = topupTrx.reduce((acc: number, t: any) => acc + (t.amount_chip || 0), 0) +
                       wdTrx.reduce((acc: number, t: any) => acc + (t.amount_chip || 0), 0)

    const formattedChipB = totalChipB.toLocaleString('id-ID', { maximumFractionDigits: 2 })

    // Bank terpakai breakdown
    const bankMap: Record<string, { count: number; totalMoney: number }> = {}
    for (const t of session.transactions) {
        if (t.status === 'APPROVED_2') {
            const bName = (t.paymentMethod?.name || t.withdrawMethod?.name || 'Lainnya').toUpperCase()
            if (!bankMap[bName]) bankMap[bName] = { count: 0, totalMoney: 0 }
            bankMap[bName].count++
            bankMap[bName].totalMoney += t.amount_money || 0
        }
    }

    let text = `LAPORAN SHIFT CS\n`
    text += `${dateFormatted}\n\n`
    text += `${session.user.username} — ${startTimeStr} s/d ${endTimeStr} (${durHours}j ${durMins}m)\n`
    text += `Transaksi: ${totalTrxCount} (Top Up ${topupTrx.length}x, WD ${wdTrx.length}x, Tolak ${declinedTrx.length}x)\n`
    text += `Nominal: Rp ${totalMoney.toLocaleString('id-ID')} · ${formattedChipB} B\n\n`

    // Bank Terpakai
    const bankEntries = Object.entries(bankMap)
    if (bankEntries.length > 0) {
        text += `Bank terpakai:\n`
        for (const [bName, stats] of bankEntries) {
            text += `  ${bName}: ${stats.count} trx, Rp ${stats.totalMoney.toLocaleString('id-ID')}\n`
        }
        text += `\n`
    }

    // Transfer Bank
    if (session.transfers && session.transfers.length > 0) {
        text += `Transfer bank:\n`
        for (const tr of session.transfers) {
            const time = getJakartaTimeString(tr.createdAt)
            const from = tr.fromBank?.name || tr.fromGameAccount?.username || '—'
            const to = tr.toBank?.name || tr.toGameAccount?.username || '—'
            text += `  ${time} ${from} → ${to}  Rp ${(tr.amount || 0).toLocaleString('id-ID')}\n`
        }
        text += `\n`
    }

    // Biaya Operasional
    if (session.operationalExpenses && session.operationalExpenses.length > 0) {
        text += `Biaya operasional:\n`
        for (const exp of session.operationalExpenses) {
            const time = getJakartaTimeString(exp.createdAt)
            text += `  ${time} ${exp.category}  Rp ${(exp.amount || 0).toLocaleString('id-ID')}\n`
        }
        text += `\n`
    }

    // Adjustment
    if (session.adjustments && session.adjustments.length > 0) {
        text += `Adjustment:\n`
        for (const adj of session.adjustments) {
            const time = getJakartaTimeString(adj.createdAt)
            const targetName = adj.bank?.name || adj.gameAccount?.username || 'Target'
            const valStr = adj.type === 'MONEY' ? `Rp ${(adj.amount || 0).toLocaleString('id-ID')}` : `${adj.amount || 0} B`
            text += `  ${time} ${targetName}  ${valStr} (${adj.reason || 'Koreksi'})\n`
        }
        text += `\n`
    }

    // DC Bos
    if (session.dcBos && session.dcBos.length > 0) {
        text += `DC Bos:\n`
        for (const dc of session.dcBos) {
            const time = getJakartaTimeString(dc.createdAt)
            text += `  ${time} Setoran ke ${dc.bank_name || 'Bank'}  Rp ${(dc.amount || 0).toLocaleString('id-ID')}\n`
        }
    }

    return text.trim()
}

// GET: Ambil teks rekap laporan shift (untuk tombol "Salin Teks")
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

        const session = await prisma.workSession.findUnique({
            where: { id: sessionId },
            include: {
                user: { select: { username: true } },
                transactions: {
                    include: {
                        paymentMethod: { select: { name: true } },
                        withdrawMethod: { select: { name: true } }
                    }
                },
                transfers: {
                    include: {
                        fromBank: { select: { name: true } },
                        toBank: { select: { name: true } },
                        fromGameAccount: { select: { username: true } },
                        toGameAccount: { select: { username: true } }
                    }
                },
                adjustments: {
                    include: {
                        bank: { select: { name: true } },
                        gameAccount: { select: { username: true } }
                    }
                },
                operationalExpenses: true,
                dcBos: true
            }
        })

        if (!session) {
            return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
        }

        const reportText = generateShiftReportText(session)

        return NextResponse.json({ reportText })
    } catch (error: any) {
        console.error('Error generating shift report text:', error)
        return NextResponse.json({ error: 'Gagal membuat teks laporan' }, { status: 500 })
    }
}

// POST: Kirim teks rekap laporan shift ke Telegram
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

        const session = await prisma.workSession.findUnique({
            where: { id: sessionId },
            include: {
                user: { select: { username: true } },
                transactions: {
                    include: {
                        paymentMethod: { select: { name: true } },
                        withdrawMethod: { select: { name: true } }
                    }
                },
                transfers: {
                    include: {
                        fromBank: { select: { name: true } },
                        toBank: { select: { name: true } },
                        fromGameAccount: { select: { username: true } },
                        toGameAccount: { select: { username: true } }
                    }
                },
                adjustments: {
                    include: {
                        bank: { select: { name: true } },
                        gameAccount: { select: { username: true } }
                    }
                },
                operationalExpenses: true,
                dcBos: true
            }
        })

        if (!session) {
            return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
        }

        const reportText = generateShiftReportText(session)
        const telegramResult = await sendCustomMessage(reportText, null)

        return NextResponse.json({
            success: true,
            message: 'Laporan shift berhasil dikirim ke grup Telegram',
            reportText,
            telegramResult
        })
    } catch (error: any) {
        console.error('Error sending shift report to Telegram:', error)
        return NextResponse.json({ error: 'Gagal mengirim laporan ke Telegram' }, { status: 500 })
    }
}
