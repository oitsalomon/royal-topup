'use client'

import React, { useState, useEffect } from 'react'
import {
    X, Clock, Landmark, ArrowRightLeft, SlidersHorizontal,
    Receipt, Crown, ListOrdered, Copy, Send, Check, AlertCircle,
    User, ShieldCheck, PowerOff
} from 'lucide-react'

interface SessionDetailModalProps {
    sessionId: number | null
    isOpen: boolean
    onClose: () => void
    onSessionUpdated?: () => void
    isMaster?: boolean
}

export default function SessionDetailModal({
    sessionId,
    isOpen,
    onClose,
    onSessionUpdated,
    isMaster = false
}: SessionDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'TRANSFERS' | 'ADJUSTMENTS' | 'EXPENSES' | 'DCBOS' | 'TIMELINE'>('TRANSACTIONS')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [copySuccess, setCopySuccess] = useState(false)
    const [sendingTelegram, setSendingTelegram] = useState(false)
    const [telegramSuccess, setTelegramSuccess] = useState<string | null>(null)
    const [closingSession, setClosingSession] = useState(false)

    useEffect(() => {
        if (!isOpen || !sessionId) {
            setData(null)
            return
        }

        const fetchDetail = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/internal/cs-sessions/${sessionId}`)
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (err) {
                console.error('Failed to fetch session details:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDetail()
    }, [isOpen, sessionId])

    if (!isOpen || !sessionId) return null

    const handleCopyText = async () => {
        try {
            const res = await fetch(`/api/internal/cs-sessions/${sessionId}/telegram`)
            if (res.ok) {
                const json = await res.json()
                if (json.reportText) {
                    await navigator.clipboard.writeText(json.reportText)
                    setCopySuccess(true)
                    setTimeout(() => setCopySuccess(false), 2500)
                }
            }
        } catch (e) {
            console.error('Failed to copy text:', e)
        }
    }

    const handleSendTelegram = async () => {
        if (!confirm('Kirim rekap laporan shift ini ke grup Telegram sekarang?')) return
        setSendingTelegram(true)
        setTelegramSuccess(null)
        try {
            const res = await fetch(`/api/internal/cs-sessions/${sessionId}/telegram`, {
                method: 'POST'
            })
            const json = await res.json()
            if (res.ok && json.success) {
                setTelegramSuccess('Laporan berhasil dikirim ke grup Telegram')
                setTimeout(() => setTelegramSuccess(null), 3000)
            } else {
                alert(json.error || 'Gagal mengirim ke Telegram')
            }
        } catch (e) {
            alert('Gangguan koneksi saat mengirim ke Telegram')
        } finally {
            setSendingTelegram(false)
        }
    }

    const handleCloseSession = async () => {
        if (!confirm('Tutup paksa shift ini sekarang? Status shift akan menjadi SELESAI (CLOSED).')) return
        setClosingSession(true)
        try {
            const res = await fetch(`/api/internal/cs-sessions/${sessionId}`, {
                method: 'POST'
            })
            const json = await res.json()
            if (res.ok && json.success) {
                if (onSessionUpdated) onSessionUpdated()
                onClose()
            } else {
                alert(json.error || 'Gagal menutup shift')
            }
        } catch (e) {
            alert('Gangguan koneksi')
        } finally {
            setClosingSession(false)
        }
    }

    const session = data?.session

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--rc-panel)] border border-[var(--rc-border)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--rc-border)] flex items-start justify-between gap-3 shrink-0 bg-[var(--rc-panel2)]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--rc-accent)]/15 border border-[var(--rc-accent)]/30 flex items-center justify-center text-[var(--rc-accent)] shrink-0">
                            <Clock size={20} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-bold text-[var(--rc-text)] truncate">
                                    Detail Shift CS: {session?.cs_name || '...'}
                                </h2>
                                {session?.status === 'ACTIVE' && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase">
                                        Shift Aktif
                                    </span>
                                )}
                                {session?.status === 'CLOSED' && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-400 uppercase">
                                        Selesai
                                    </span>
                                )}
                                {session?.status === 'EXPIRED' && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase">
                                        Expired
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--rc-muted)] mt-0.5">
                                Mulai: {session?.started_at_display || '—'} {session?.ended_at_display ? `· Selesai: ${session.ended_at_display}` : ''} ({session?.durationFormatted || '—'})
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-[var(--rc-panel)] text-[var(--rc-muted)] hover:text-[var(--rc-text)] border border-[var(--rc-border)] transition-colors shrink-0 cursor-pointer"
                    >
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Sub-Header Actions */}
                <div className="px-4 py-2.5 bg-[var(--rc-panel)] border-b border-[var(--rc-border)] flex items-center justify-between gap-2 flex-wrap shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyText}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--rc-panel2)] hover:bg-[var(--rc-border)] border border-[var(--rc-border)] text-xs font-semibold text-[var(--rc-text)] transition-colors cursor-pointer"
                        >
                            {copySuccess ? <Check size={14} strokeWidth={1.5} className="text-emerald-400" /> : <Copy size={14} strokeWidth={1.5} />}
                            <span>{copySuccess ? 'Tersalin ke Clipboard' : 'Salin Teks'}</span>
                        </button>

                        <button
                            type="button"
                            disabled={sendingTelegram}
                            onClick={handleSendTelegram}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--rc-accent)] hover:opacity-90 disabled:opacity-50 text-[var(--rc-onaccent)] text-xs font-bold transition-all cursor-pointer"
                        >
                            <Send size={14} strokeWidth={1.5} />
                            <span>{sendingTelegram ? 'Mengirim...' : 'Kirim ke Grup Telegram'}</span>
                        </button>

                        {telegramSuccess && (
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                                <Check size={14} strokeWidth={1.5} /> {telegramSuccess}
                            </span>
                        )}
                    </div>

                    {isMaster && session?.status === 'ACTIVE' && (
                        <button
                            type="button"
                            disabled={closingSession}
                            onClick={handleCloseSession}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                            <PowerOff size={14} strokeWidth={1.5} />
                            <span>{closingSession ? 'Menutup...' : 'Tutup Sesi Manual'}</span>
                        </button>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto border-b border-[var(--rc-border)] bg-[var(--rc-panel2)] px-4 shrink-0 custom-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveTab('TRANSACTIONS')}
                        className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'TRANSACTIONS'
                                ? 'border-[var(--rc-accent)] text-[var(--rc-accent)]'
                                : 'border-transparent text-[var(--rc-muted)] hover:text-[var(--rc-text)]'
                        }`}
                    >
                        <Landmark size={14} strokeWidth={1.5} />
                        <span>Transaksi per Bank ({data?.bankBreakdown?.length || 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('TRANSFERS')}
                        className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'TRANSFERS'
                                ? 'border-[var(--rc-accent)] text-[var(--rc-accent)]'
                                : 'border-transparent text-[var(--rc-muted)] hover:text-[var(--rc-text)]'
                        }`}
                    >
                        <ArrowRightLeft size={14} strokeWidth={1.5} />
                        <span>Transfer Bank ({data?.transfers?.length || 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('ADJUSTMENTS')}
                        className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'ADJUSTMENTS'
                                ? 'border-[var(--rc-accent)] text-[var(--rc-accent)]'
                                : 'border-transparent text-[var(--rc-muted)] hover:text-[var(--rc-text)]'
                        }`}
                    >
                        <SlidersHorizontal size={14} strokeWidth={1.5} />
                        <span>Adjustment ({data?.adjustments?.length || 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('EXPENSES')}
                        className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'EXPENSES'
                                ? 'border-[var(--rc-accent)] text-[var(--rc-accent)]'
                                : 'border-transparent text-[var(--rc-muted)] hover:text-[var(--rc-text)]'
                        }`}
                    >
                        <Receipt size={14} strokeWidth={1.5} />
                        <span>Biaya Operasional ({data?.expenses?.length || 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('DCBOS')}
                        className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'DCBOS'
                                ? 'border-[var(--rc-accent)] text-[var(--rc-accent)]'
                                : 'border-transparent text-[var(--rc-muted)] hover:text-[var(--rc-text)]'
                        }`}
                    >
                        <Crown size={14} strokeWidth={1.5} />
                        <span>DC Bos ({data?.dcBos?.length || 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('TIMELINE')}
                        className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'TIMELINE'
                                ? 'border-[var(--rc-accent)] text-[var(--rc-accent)]'
                                : 'border-transparent text-[var(--rc-muted)] hover:text-[var(--rc-text)]'
                        }`}
                    >
                        <ListOrdered size={14} strokeWidth={1.5} />
                        <span>Timeline Kronologis ({data?.timeline?.length || 0})</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                    {loading && (
                        <div className="py-16 text-center text-[var(--rc-muted)] text-sm">
                            Memuat data shift...
                        </div>
                    )}

                    {!loading && data && (
                        <>
                            {/* Tab a: Transaksi Breakdown per Bank */}
                            {activeTab === 'TRANSACTIONS' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-3.5 rounded-xl bg-[var(--rc-panel2)] border border-[var(--rc-border)]">
                                            <p className="text-[11px] font-bold text-[var(--rc-muted)] uppercase tracking-wider">Total Transaksi Selesai</p>
                                            <p className="text-lg font-black text-[var(--rc-text)] mt-1">
                                                {(session?.counts?.topup || 0) + (session?.counts?.withdraw || 0)} Trx
                                            </p>
                                            <p className="text-[10px] text-[var(--rc-muted)] mt-0.5">
                                                Top Up: {session?.counts?.topup || 0} · WD: {session?.counts?.withdraw || 0}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-[var(--rc-panel2)] border border-[var(--rc-border)]">
                                            <p className="text-[11px] font-bold text-[var(--rc-muted)] uppercase tracking-wider">Total Nominal Uang</p>
                                            <p className="text-lg font-black text-emerald-400 mt-1">
                                                Rp {(session?.totals?.money || 0).toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-[10px] text-[var(--rc-muted)] mt-0.5">Perputaran kas shift</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-[var(--rc-panel2)] border border-[var(--rc-border)]">
                                            <p className="text-[11px] font-bold text-[var(--rc-muted)] uppercase tracking-wider">Total Volume Chip</p>
                                            <p className="text-lg font-black text-[var(--rc-accent)] mt-1">
                                                {(session?.totals?.chip_B || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} B
                                            </p>
                                            <p className="text-[10px] text-[var(--rc-muted)] mt-0.5">Chip terproses</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-[var(--rc-muted)] uppercase tracking-wider mb-2">Breakdown Rekening / Bank</h4>
                                        {data.bankBreakdown?.length === 0 ? (
                                            <div className="p-8 text-center text-xs text-[var(--rc-muted)] bg-[var(--rc-panel2)] rounded-xl border border-[var(--rc-border)]">
                                                Belum ada transaksi sukses yang tercatat pada sesi ini
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-[var(--rc-border)] border border-[var(--rc-border)] rounded-xl overflow-hidden">
                                                {data.bankBreakdown?.map((b: any) => (
                                                    <div key={b.bank} className="flex items-center justify-between p-3 bg-[var(--rc-panel)] hover:bg-[var(--rc-panel2)] transition-colors text-xs">
                                                        <div className="flex items-center gap-2.5">
                                                            <Landmark size={15} strokeWidth={1.5} className="text-[var(--rc-accent)] shrink-0" />
                                                            <span className="font-bold text-[var(--rc-text)]">{b.bank}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[var(--rc-muted)]">{b.count} transaksi</span>
                                                            <span className="font-mono font-bold text-[var(--rc-text)]">
                                                                Rp {b.totalMoney.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab b: Transfer Bank */}
                            {activeTab === 'TRANSFERS' && (
                                <div>
                                    {data.transfers?.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-[var(--rc-muted)] bg-[var(--rc-panel2)] rounded-xl border border-[var(--rc-border)]">
                                            Tidak ada mutasi transfer bank selama sesi ini
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-[var(--rc-border)] rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-[var(--rc-panel2)] text-[var(--rc-muted)] border-b border-[var(--rc-border)] uppercase text-[10px] font-bold tracking-wider">
                                                    <tr>
                                                        <th className="p-3">Jam (WIB)</th>
                                                        <th className="p-3">Dari Rekening</th>
                                                        <th className="p-3">Ke Rekening</th>
                                                        <th className="p-3 text-right">Nominal</th>
                                                        <th className="p-3">Keterangan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--rc-border)]">
                                                    {data.transfers?.map((tr: any) => (
                                                        <tr key={tr.id} className="hover:bg-[var(--rc-panel2)] transition-colors">
                                                            <td className="p-3 font-mono font-semibold text-[var(--rc-accent)]">{tr.time}</td>
                                                            <td className="p-3 font-semibold text-[var(--rc-text)]">{tr.from}</td>
                                                            <td className="p-3 font-semibold text-[var(--rc-text)]">{tr.to}</td>
                                                            <td className="p-3 text-right font-mono font-bold text-white">Rp {tr.amount.toLocaleString('id-ID')}</td>
                                                            <td className="p-3 text-[var(--rc-muted)]">{tr.note}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab c: Adjustment */}
                            {activeTab === 'ADJUSTMENTS' && (
                                <div>
                                    {data.adjustments?.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-[var(--rc-muted)] bg-[var(--rc-panel2)] rounded-xl border border-[var(--rc-border)]">
                                            Tidak ada penyesuaian (adjustment) selama sesi ini
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-[var(--rc-border)] rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-[var(--rc-panel2)] text-[var(--rc-muted)] border-b border-[var(--rc-border)] uppercase text-[10px] font-bold tracking-wider">
                                                    <tr>
                                                        <th className="p-3">Jam (WIB)</th>
                                                        <th className="p-3">Target</th>
                                                        <th className="p-3">Aksi</th>
                                                        <th className="p-3">Nominal Uang / Chip</th>
                                                        <th className="p-3">Alasan Koreksi</th>
                                                        <th className="p-3">IP</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--rc-border)]">
                                                    {data.adjustments?.map((adj: any) => (
                                                        <tr key={adj.id} className="hover:bg-[var(--rc-panel2)] transition-colors">
                                                            <td className="p-3 font-mono font-semibold text-[var(--rc-accent)]">{adj.time}</td>
                                                            <td className="p-3 font-semibold text-[var(--rc-text)]">{adj.target}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${adj.action === 'ADD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {adj.action === 'ADD' ? '+ TAMBAH' : '- KURANG'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 font-mono font-bold text-[var(--rc-text)]">
                                                                {adj.amount_chip ? `${adj.amount_chip} B Chip ` : ''}
                                                                {adj.amount_money ? `Rp ${adj.amount_money.toLocaleString('id-ID')}` : ''}
                                                            </td>
                                                            <td className="p-3 text-[var(--rc-muted)]">{adj.reason}</td>
                                                            <td className="p-3 font-mono text-[11px] text-[var(--rc-muted)]">{adj.ip_address}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab d: Biaya Operasional */}
                            {activeTab === 'EXPENSES' && (
                                <div>
                                    {data.expenses?.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-[var(--rc-muted)] bg-[var(--rc-panel2)] rounded-xl border border-[var(--rc-border)]">
                                            Tidak ada catatan biaya operasional selama sesi ini
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-[var(--rc-border)] rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-[var(--rc-panel2)] text-[var(--rc-muted)] border-b border-[var(--rc-border)] uppercase text-[10px] font-bold tracking-wider">
                                                    <tr>
                                                        <th className="p-3">Jam (WIB)</th>
                                                        <th className="p-3">Kategori</th>
                                                        <th className="p-3">Keterangan</th>
                                                        <th className="p-3">Rekening Bank</th>
                                                        <th className="p-3 text-right">Nominal Biaya</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--rc-border)]">
                                                    {data.expenses?.map((exp: any) => (
                                                        <tr key={exp.id} className="hover:bg-[var(--rc-panel2)] transition-colors">
                                                            <td className="p-3 font-mono font-semibold text-[var(--rc-accent)]">{exp.time}</td>
                                                            <td className="p-3 font-bold text-[var(--rc-text)]">{exp.category}</td>
                                                            <td className="p-3 text-[var(--rc-text2)]">{exp.description}</td>
                                                            <td className="p-3 text-[var(--rc-muted)]">{exp.bank_name}</td>
                                                            <td className="p-3 text-right font-mono font-bold text-red-400">Rp {exp.amount.toLocaleString('id-ID')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab e: DC Bos / Setoran */}
                            {activeTab === 'DCBOS' && (
                                <div>
                                    {data.dcBos?.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-[var(--rc-muted)] bg-[var(--rc-panel2)] rounded-xl border border-[var(--rc-border)]">
                                            Tidak ada catatan setoran DC Bos selama sesi ini
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-[var(--rc-border)] rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-[var(--rc-panel2)] text-[var(--rc-muted)] border-b border-[var(--rc-border)] uppercase text-[10px] font-bold tracking-wider">
                                                    <tr>
                                                        <th className="p-3">Jam (WIB)</th>
                                                        <th className="p-3">Ke Rekening</th>
                                                        <th className="p-3">Keterangan</th>
                                                        <th className="p-3 text-right">Nominal Setoran</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--rc-border)]">
                                                    {data.dcBos?.map((dc: any) => (
                                                        <tr key={dc.id} className="hover:bg-[var(--rc-panel2)] transition-colors">
                                                            <td className="p-3 font-mono font-semibold text-[var(--rc-accent)]">{dc.time}</td>
                                                            <td className="p-3 font-bold text-[var(--rc-text)]">{dc.toBank}</td>
                                                            <td className="p-3 text-[var(--rc-muted)]">{dc.note}</td>
                                                            <td className="p-3 text-right font-mono font-bold text-[var(--rc-accent)]">Rp {dc.amount.toLocaleString('id-ID')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab f: Timeline Kronologis */}
                            {activeTab === 'TIMELINE' && (
                                <div>
                                    {data.timeline?.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-[var(--rc-muted)] bg-[var(--rc-panel2)] rounded-xl border border-[var(--rc-border)]">
                                            Belum ada aktivitas tercatat pada timeline sesi ini
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-[var(--rc-border)] ml-3 space-y-4 py-2">
                                            {data.timeline?.map((ev: any, idx: number) => (
                                                <div key={idx} className="relative pl-6">
                                                    {/* Marker Dot */}
                                                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[var(--rc-panel)] border-2 border-[var(--rc-accent)] shrink-0" />
                                                    
                                                    <div className="p-3 rounded-xl bg-[var(--rc-panel2)] border border-[var(--rc-border)] space-y-1">
                                                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                                            <span className="font-mono font-bold text-[var(--rc-accent)]">
                                                                {ev.time} WIB
                                                            </span>
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--rc-panel)] text-[var(--rc-muted)] border border-[var(--rc-border)]">
                                                                {ev.action}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[var(--rc-text)] leading-relaxed">
                                                            {ev.detail}
                                                        </p>
                                                        {ev.ip && ev.ip !== '—' && (
                                                            <p className="text-[10px] text-[var(--rc-muted)] font-mono pt-0.5">
                                                                IP: {ev.ip}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
