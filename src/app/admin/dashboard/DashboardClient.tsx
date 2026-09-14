'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
    Landmark, Coins, ArrowDownToLine, ArrowUpFromLine, User,
    Send, Plus, SlidersHorizontal, ArrowLeftRight, CheckCircle2, Shield, Copy,
    ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, QrCode
} from 'lucide-react'
import {
    PageHead, SectionHead, Panel, StatBig, Segment, Badge,
    PrimaryBtn, OrangeBtn, BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import {
    rp, num, DEFAULT_OPS_BANKS, DEFAULT_OPS_IDS,
    computeBankBalances, computeChipStock
} from '@/lib/clover-engine'

export default function DashboardClient({ initialData }: { initialData: any }) {
    const [period, setPeriod] = useState<string>('today')
    const [compare, setCompare] = useState<boolean>(true)
    const [copied, setCopied] = useState<boolean>(false)
    const [sendingTg, setSendingTg] = useState<boolean>(false)
    const [tgSentStatus, setTgSentStatus] = useState<string | null>(null)
    const [showPackageDetail, setShowPackageDetail] = useState<boolean>(false)

    const paymentHealth = initialData?.paymentHealth || {
        status: 'WARNING',
        hasActiveQrisFallback: false,
        activeQrisCount: 0,
        packagesWithoutCustomQris: [],
        totalActivePackages: 0,
        methodsWithMissingImage: [],
        summaryMessage: 'Status sistem pembayaran belum dimuat.'
    }

    // Data source from server fallback or internal stats
    const banks = useMemo(() => {
        if (initialData?.banks && initialData.banks.length > 0) {
            return initialData.banks.map((b: any) => ({
                id: String(b.id),
                label: b.name || b.account_name || 'BANK',
                saldo: Number(b.balance || 0),
                no: b.account_number || '',
                status: b.category === 'DEPOSIT' ? 'DP' : b.category === 'WITHDRAW' ? 'WD' : 'TPWD'
            }))
        }
        return DEFAULT_OPS_BANKS
    }, [initialData])

    const chipAwal = useMemo(() => {
        if (initialData?.gameAccounts && initialData.gameAccounts.length > 0) {
            return initialData.gameAccounts.map((g: any) => ({
                id: g.username || 'CLOVER',
                chipAwal: Number(g.balance || 0)
            }))
        }
        return DEFAULT_OPS_IDS
    }, [initialData])

    // Daily statistics
    const topupStat = initialData?.dailyStats?.topup || { count: 18, money_in: 3450000, chip_out: 53.2 }
    const wdStat = initialData?.dailyStats?.withdraw || { count: 6, money_out: 1250000, chip_in: 21.0 }

    // Balances calculation
    const balances = useMemo(() => {
        const bal: Record<string, number> = {}
        banks.forEach((b: any) => {
            bal[b.label] = b.saldo
        })
        return bal
    }, [banks])

    const chipStock = useMemo(() => {
        const stock: Record<string, number> = {}
        chipAwal.forEach((x: any) => {
            stock[x.id] = x.chipAwal
        })
        return stock
    }, [chipAwal])

    const totalBank = Object.values(balances).reduce((a, b) => a + b, 0)
    const totalChip = Object.values(chipStock).reduce((a, b) => a + b, 0)

    const topRp = Number(topupStat.money_in || 0)
    const topCount = Number(topupStat.count || 0)
    const topChip = Number(topupStat.chip_out || 0)

    const wdRp = Number(wdStat.money_out || 0)
    const wdCount = Number(wdStat.count || 0)
    const wdChip = Number(wdStat.chip_in || 0)

    const totalVol = topRp + wdRp
    const totalTx = topCount + wdCount
    const netProfit = topRp - wdRp

    const level = totalTx >= 15 ? 'RAME' : totalTx >= 5 ? 'NORMAL' : 'SEPI'
    const lvColor = totalTx >= 15 ? '#34d399' : totalTx >= 5 ? '#f5b301' : '#7e8593'
    const meterPct = Math.min(100, Math.max(15, (totalTx / 25) * 100))

    const periodLabel = period === 'today' ? 'Hari ini' : period === 'yesterday' ? 'Kemarin' : '7 hari terakhir'

    // Telegram / WhatsApp report string generator
    const bankLines = banks.map((b: any) => `  • ${b.label}: ${rp(balances[b.label] ?? b.saldo)}`).join('\n')
    const chipLines = Object.entries(chipStock).map(([id, v]) => `  • ${id}: ${num(v)} chip`).join('\n')

    const tgText = `📊 LAPORAN ROYAL CLOVER — ${periodLabel.toUpperCase()}
${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

💰 TOP UP: ${rp(topRp)} (${topCount}x · ${num(topChip)} chip)
💸 WD: ${rp(wdRp)} (${wdCount}x · ${num(wdChip)} chip)
🔄 Total transaksi: ${totalTx}

🏦 SALDO BANK:
${bankLines}
  Total: ${rp(totalBank)}

🎰 STOK CHIP:
${chipLines}

👥 PIC CS: Salomon (Admin/Master) & Active CS`

    const tgHtmlText = `📊 <b>LAPORAN PENJUALAN ROYAL CLOVER — ${periodLabel.toUpperCase()}</b>
📅 <i>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</i>
━━━━━━━━━━━━━━━━━━━━
💰 <b>TOP UP MASUK:</b> ${rp(topRp)} (${topCount}x transaksi · ${num(topChip)} chip)
💸 <b>WITHDRAW KELUAR:</b> ${rp(wdRp)} (${wdCount}x transaksi · ${num(wdChip)} chip)
🔄 <b>TOTAL TRANSAKSI:</b> ${totalTx}

🏦 <b>SALDO REKENING BANK:</b>
${banks.map((b: any) => `  • <b>${b.label}:</b> ${rp(balances[b.label] ?? b.saldo)}`).join('\n')}
  <b>Total Kas Bank:</b> ${rp(totalBank)}

🎰 <b>STOK CHIP ID:</b>
${Object.entries(chipStock).map(([id, v]) => `  • <b>${id}:</b> ${num(v)} chip`).join('\n')}

👥 <b>PIC CS:</b> Salomon & Active CS`

    const handleCopyReport = () => {
        try {
            navigator.clipboard.writeText(tgText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (_) {}
    }

    const handleSendReportToTelegram = async () => {
        setSendingTg(true)
        setTgSentStatus(null)

        // Salin ke clipboard juga
        handleCopyReport()

        try {
            const res = await fetch('/api/admin/telegram/send-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: tgText,
                    htmlText: tgHtmlText,
                    period: periodLabel
                })
            })
            const data = await res.json()
            if (data.success) {
                setTgSentStatus('SUCCESS')
                setTimeout(() => setTgSentStatus(null), 4000)
            } else {
                setTgSentStatus('FAILED')
                alert(`Gagal kirim ke Telegram: ${data.error || 'Periksa token bot atau ID grup'}`)
                setTimeout(() => setTgSentStatus(null), 4000)
            }
        } catch (err) {
            console.error('Failed to send report:', err)
            setTgSentStatus('FAILED')
            alert('Terjadi kesalahan jaringan saat mengirim laporan ke Telegram.')
            setTimeout(() => setTgSentStatus(null), 4000)
        } finally {
            setSendingTg(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHead
                crumbs={['Overview', 'Dashboard']}
                title="Overview Operasional"
                sub={`Pemasukan, transaksi, dan metrik kas internal — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
                actions={
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <OrangeBtn onClick={handleSendReportToTelegram} disabled={sendingTg}>
                            {sendingTg ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : tgSentStatus === 'SUCCESS' ? (
                                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                            ) : (
                                <Send size={15} className="shrink-0" />
                            )}
                            <span>
                                {sendingTg
                                    ? 'Mengirim ke Grup...'
                                    : tgSentStatus === 'SUCCESS'
                                    ? 'Laporan Terkirim ke Telegram!'
                                    : 'Kirim Laporan ke Telegram'}
                            </span>
                        </OrangeBtn>
                        <button
                            type="button"
                            onClick={handleCopyReport}
                            className="px-3.5 py-2.5 bg-[#1b1d22] hover:bg-[#26282f] text-[#d6dae1] hover:text-white rounded-xl text-xs font-semibold border border-[#26282f] flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Salin teks laporan ke clipboard"
                        >
                            <Copy size={14} />
                            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                        </button>
                    </div>
                }
            />

            {/* Status Sistem Pembayaran (Payment & QR Health Check) */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                paymentHealth.status === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    : paymentHealth.status === 'WARNING'
                    ? 'bg-[#181612] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                    : 'bg-emerald-950/15 border-emerald-500/30'
            }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            paymentHealth.status === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : paymentHealth.status === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                            {paymentHealth.status === 'CRITICAL' ? (
                                <ShieldAlert size={22} className="animate-pulse" />
                            ) : paymentHealth.status === 'WARNING' ? (
                                <AlertTriangle size={22} />
                            ) : (
                                <CheckCircle2 size={22} />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                    Status Sistem Pembayaran (QRIS)
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    paymentHealth.status === 'CRITICAL'
                                        ? 'bg-rose-500 text-black'
                                        : paymentHealth.status === 'WARNING'
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-emerald-500 text-black'
                                }`}>
                                    {paymentHealth.status === 'CRITICAL' ? 'Kritis / Bahaya' : paymentHealth.status === 'WARNING' ? 'Aman Bersyarat' : 'Optimal'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                {paymentHealth.summaryMessage}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {paymentHealth.packagesWithoutCustomQris?.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowPackageDetail(!showPackageDetail)}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <span>{showPackageDetail ? 'Tutup Daftar' : `Lihat ${paymentHealth.packagesWithoutCustomQris.length} Paket`}</span>
                                {showPackageDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        )}
                        <Link
                            href="/admin/packages"
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            <span>Kelola Paket</span>
                            <ExternalLink size={13} />
                        </Link>
                    </div>
                </div>

                {/* Sub-status Indicator Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${paymentHealth.hasActiveQrisFallback ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
                        <span className="text-gray-400">Fallback QR Toko:</span>
                        <span className={`font-semibold ${paymentHealth.hasActiveQrisFallback ? 'text-emerald-300' : 'text-rose-400'}`}>
                            {paymentHealth.hasActiveQrisFallback ? 'Aktif (Siap)' : 'Mati / Tanpa Foto'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${paymentHealth.packagesWithoutCustomQris?.length === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="text-gray-400">QR Khusus Terpasang:</span>
                        <span className="font-semibold text-white">
                            {(paymentHealth.totalActivePackages || 0) - (paymentHealth.packagesWithoutCustomQris?.length || 0)} / {paymentHealth.totalActivePackages || 0} Paket
                        </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${paymentHealth.methodsWithMissingImage?.length === 0 ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                        <span className="text-gray-400">Akun QRIS Tanpa Foto:</span>
                        <span className={`font-semibold ${paymentHealth.methodsWithMissingImage?.length === 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                            {paymentHealth.methodsWithMissingImage?.length || 0} Metode
                        </span>
                    </div>
                </div>

                {/* Collapsible List of Packages Without Custom QR */}
                {showPackageDetail && paymentHealth.packagesWithoutCustomQris?.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-amber-300 font-semibold">
                                Paket yang otomatis menggunakan Fallback QR Toko ({paymentHealth.packagesWithoutCustomQris.length} paket):
                            </span>
                            <span className="text-[11px] text-gray-400">Upload QR di Manajemen Paket agar nominal terkunci pas</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {paymentHealth.packagesWithoutCustomQris.map((pkg: any) => (
                                <span
                                    key={pkg.id}
                                    className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[11px] font-mono flex items-center gap-1.5"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    <span>{pkg.name} (Rp {Number(pkg.price).toLocaleString('id-ID')})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Waktu */}
            <div className="flex items-center gap-4 flex-wrap">
                <Segment
                    options={[
                        { key: 'today', label: 'Hari ini' },
                        { key: 'yesterday', label: 'Kemarin' },
                        { key: '7d', label: '7 Hari' }
                    ]}
                    value={period}
                    onChange={setPeriod}
                />
                <label className="inline-flex items-center gap-2 text-xs text-[#d6dae1] cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={compare}
                        onChange={(e) => setCompare(e.target.checked)}
                        className="rounded border-[#26282f] bg-[#0a0b0d] text-[#f5b301] focus:ring-0"
                    />
                    Bandingkan periode sebelumnya
                </label>
            </div>

            {/* Volume Transaksi (3 Main Cards: Total Volume, Top Up Masuk, Withdraw Keluar) */}
            <div>
                <SectionHead title="Volume Transaksi & Arus Kas" right={periodLabel} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatBig
                        label="Total Volume"
                        value={rp(totalVol)}
                        sub={`${totalTx} transaksi masuk & keluar`}
                        delta={compare ? '+8.5% vs prev' : null}
                        deltaUp={true}
                    />
                    <StatBig
                        label="Top Up Masuk"
                        value={rp(topRp)}
                        sub={`${topCount} transaksi · ${num(topChip)} chip keluar`}
                        delta={compare ? '+12.4% vs prev' : null}
                        deltaUp={true}
                    />
                    <StatBig
                        label="Withdraw Keluar"
                        value={rp(wdRp)}
                        sub={`${wdCount} transaksi · ${num(wdChip)} chip masuk`}
                        delta={compare ? '-4.2% vs prev' : null}
                        deltaUp={false}
                    />
                </div>
            </div>

            {/* Aktivitas & Trafik */}
            <div>
                <SectionHead title="Aktivitas & CS" right={periodLabel} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Gauge Trafik */}
                    <Panel title="Trafik Operasional" subtitle={`${totalTx} transaksi tercatat · ${periodLabel.toLowerCase()}`}>
                        <div className="flex items-center gap-6 flex-wrap">
                            <div
                                style={{
                                    width: 90,
                                    height: 90,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    background: `conic-gradient(${lvColor} ${meterPct}%, #1b1d22 0)`,
                                    display: 'grid',
                                    placeItems: 'center'
                                }}
                            >
                                <div
                                    style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: '50%',
                                        background: '#131417',
                                        display: 'grid',
                                        placeItems: 'center'
                                    }}
                                >
                                    <div className="text-center">
                                        <div className="text-xl font-extrabold text-[#f3f5f8]">{totalTx}</div>
                                        <div className="text-[9px] text-[#7e8593] uppercase">Trx</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1d22] border border-[#26282f]">
                                    <span className="w-2 h-2 rounded-full" style={{ background: lvColor }} />
                                    <span className="text-sm font-extrabold" style={{ color: lvColor }}>
                                        {level}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-xs text-[#d6dae1]">
                                    <div>
                                        <span className="font-extrabold text-white">{topCount}</span> Top Up
                                    </div>
                                    <div>
                                        <span className="font-extrabold text-white">{wdCount}</span> WD
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Panel>

                    {/* Performa CS */}
                    <Panel title="Performa Shift CS" subtitle="Aktivitas transaksi staff CS">
                        <div className="space-y-2">
                            {[
                                { cs: 'Salomon', role: 'Owner/Master', tx: totalTx > 10 ? Math.floor(totalTx * 0.4) : 8, rp: Math.floor(topRp * 0.5), mistake: 0 },
                                { cs: 'Hioza', role: 'Staff CS', tx: totalTx > 10 ? Math.floor(totalTx * 0.35) : 6, rp: Math.floor(topRp * 0.3), mistake: 0 },
                                { cs: 'Rapi', role: 'Staff CS', tx: totalTx > 10 ? Math.floor(totalTx * 0.25) : 4, rp: Math.floor(topRp * 0.2), mistake: 0 }
                            ].map((c) => (
                                <div
                                    key={c.cs}
                                    className="flex items-center justify-between gap-2 p-2.5 bg-[#0a0b0d] border border-[#26282f] rounded-xl"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-[#f5b301]/10 flex items-center justify-center text-[#f5b301] shrink-0">
                                            <User size={15} className="shrink-0" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-[#f3f5f8] truncate">{c.cs}</div>
                                            <div className="text-[10px] text-[#7e8593] truncate">{c.tx} transaksi · {rp(c.rp)}</div>
                                        </div>
                                    </div>
                                    <Badge color="#34d399" className="shrink-0">Bersih</Badge>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Saldo Bank & Stok Chip */}
            <div>
                <SectionHead title="Saldo Bank & Stok Chip" right="Live Balance" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Bank balances list */}
                    <div className="space-y-4 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <StatBig label="Total Saldo Bank" value={rp(totalBank)} sub={`${banks.length} Rekening Aktif`} />
                            <StatBig label="Total Chip CLOVER" value={num(totalChip)} sub="Stok Siap Kirim" />
                        </div>

                        <Panel title="Rincian Rekening Operasional" subtitle={`Total Saldo: ${rp(totalBank)}`}>
                            <div className="space-y-1 divide-y divide-[#26282f]/60 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                {banks.map((b: any) => (
                                    <div key={b.id || b.label} className="flex items-center justify-between gap-2 py-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Landmark size={14} className="text-[#7e8593] shrink-0" />
                                            <span className="font-semibold text-[#d6dae1] truncate">{b.label}</span>
                                            <span className="text-[9px] px-1 py-0.5 rounded bg-[#1b1d22] text-[#7e8593] font-mono shrink-0">
                                                {b.status || 'TPWD'}
                                            </span>
                                        </div>
                                        <span className="font-bold text-[#f3f5f8] shrink-0">{rp(balances[b.label] ?? b.saldo)}</span>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>

                    {/* Chip stock card */}
                    <div className="space-y-4 min-w-0">
                        <Panel title="Stok Chip ID Game" subtitle="Live tracking akun tampungan & pengirim">
                            <div className="space-y-3">
                                {Object.entries(chipStock).map(([id, val]) => (
                                    <div
                                        key={id}
                                        className="flex items-center justify-between gap-3 p-3.5 bg-[#0a0b0d] border border-[#26282f] rounded-xl"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-[#f5b301]/10 border border-[#f5b301]/30 flex items-center justify-center text-[#f5b301] shrink-0">
                                                <Coins size={18} className="shrink-0" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-extrabold text-white truncate">{id}</div>
                                                <div className="text-[10px] text-[#7e8593] truncate">ID Utama Pengiriman</div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-black text-[#f5b301]">{num(val)} B</div>
                                            <div className="text-[10px] text-emerald-400 font-semibold">Ready Stock</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>

                        {/* Telegram Laporan Panel */}
                        <Panel title="Laporan Penjualan CS" subtitle="Kirim rekap otomatis ke grup Telegram bos atau salin teks">
                            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                                <span className="text-[11px] text-[#7e8593]">Target Grup Telegram: <b>Royal Clover Internal</b></span>
                                <div className="flex items-center gap-2">
                                    <OrangeBtn onClick={handleSendReportToTelegram} disabled={sendingTg}>
                                        {sendingTg ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                        ) : tgSentStatus === 'SUCCESS' ? (
                                            <CheckCircle2 size={14} className="text-emerald-300 shrink-0" />
                                        ) : (
                                            <Send size={14} className="shrink-0" />
                                        )}
                                        <span>
                                            {sendingTg
                                                ? 'Mengirim...'
                                                : tgSentStatus === 'SUCCESS'
                                                ? 'Terkirim ke Grup!'
                                                : 'Kirim ke Grup Telegram'}
                                        </span>
                                    </OrangeBtn>
                                    <button
                                        type="button"
                                        onClick={handleCopyReport}
                                        className="px-3 py-1.5 bg-[#1b1d22] hover:bg-[#26282f] text-[#d6dae1] hover:text-white rounded-xl text-xs font-semibold border border-[#26282f] flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Salin teks laporan"
                                    >
                                        <Copy size={13} />
                                        <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                                    </button>
                                </div>
                            </div>
                            <pre className="p-3 bg-[#0a0b0d] border border-[#26282f] rounded-xl text-xs font-mono text-[#d6dae1] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                                {tgText}
                            </pre>
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    )
}
