'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    Clock, User, Landmark, Coins, ArrowLeftRight, CheckCircle2,
    Search, Filter, ShieldCheck, Lock, ExternalLink, Calendar,
    ChevronRight, RefreshCw, AlertTriangle
} from 'lucide-react'
import {
    PageHead, Panel, StatBig, Badge, SelectInput,
    PrimaryBtn, BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import DateTimePickerRange, { DateTimeRangeValue } from '@/components/admin/DateTimePickerRange'
import { getJakartaTodayRange, formatJakartaDisplay } from '@/lib/timezone'
import SessionDetailModal from '@/components/admin/SessionDetailModal'

export default function CsSessionsPage() {
    const today = getJakartaTodayRange()
    const [dateRange, setDateRange] = useState<DateTimeRangeValue>({
        startDateStr: today.startDateStr,
        startTimeStr: '00:00',
        endDateStr: today.endDateStr,
        endTimeStr: '23:59'
    })

    const [selectedCs, setSelectedCs] = useState<string>('ALL')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [sessions, setSessions] = useState<any[]>([])
    const [staffList, setStaffList] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

    // Otorisasi Akses: Hanya Master / Salomon / SUPER_ADMIN
    useEffect(() => {
        try {
            const stored = localStorage.getItem('user')
            if (stored) {
                const user = JSON.parse(stored)
                const isMaster = Boolean(
                    user.role === 'SUPER_ADMIN' ||
                    user.role === 'OWNER' ||
                    user.username?.toLowerCase() === 'salomon' ||
                    user.permissions?.includes('MASTER')
                )
                setIsAuthorized(isMaster)
            } else {
                setIsAuthorized(false)
            }
        } catch {
            setIsAuthorized(false)
        }
    }, [])

    const fetchSessions = useCallback(async () => {
        setLoading(true)
        try {
            const query = new URLSearchParams({
                startDate: dateRange.startDateStr,
                startTime: dateRange.startTimeStr,
                endDate: dateRange.endDateStr,
                endTime: dateRange.endTimeStr,
                userId: selectedCs !== 'ALL' ? selectedCs : '',
                status: statusFilter,
                limit: '100'
            })

            const res = await fetch(`/api/internal/cs-sessions?${query.toString()}`)
            if (res.ok) {
                const data = await res.json()
                if (data.sessions) setSessions(data.sessions)
                if (data.staffList) setStaffList(data.staffList)
            }
        } catch (error) {
            console.error('Failed to fetch CS sessions:', error)
        } finally {
            setLoading(false)
        }
    }, [dateRange, selectedCs, statusFilter])

    useEffect(() => {
        if (isAuthorized) {
            fetchSessions()
        }
    }, [isAuthorized, fetchSessions])

    if (isAuthorized === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                    <Lock size={26} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-bold text-[var(--rc-text)]">Akses Terbatas (Privat)</h2>
                <p className="text-xs text-[var(--rc-muted)] mt-1 max-w-sm">
                    Halaman Riwayat Shift CS hanya dapat diakses oleh akun Master / Owner.
                </p>
                <Link
                    href="/admin/dashboard"
                    className="mt-5 px-4 py-2 rounded-xl bg-[var(--rc-accent)] text-[var(--rc-onaccent)] font-bold text-xs"
                >
                    Kembali ke Dashboard
                </Link>
            </div>
        )
    }

    if (isAuthorized === null) {
        return null
    }

    // Hitung total ringkasan
    const totalTrxCount = sessions.reduce((acc, s) => acc + (s.counts?.topup || 0) + (s.counts?.withdraw || 0), 0)
    const totalMoneyAll = sessions.reduce((acc, s) => acc + (s.totals?.money || 0), 0)
    const totalChipAll = sessions.reduce((acc, s) => acc + (s.totals?.chip_B || 0), 0)
    const activeSessionsCount = sessions.filter(s => s.status === 'ACTIVE').length

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Privat', 'Riwayat Shift CS']}
                title="Monitoring & Rekap Shift CS"
                sub="Catatan per-shift kerja staff operasional, rincian perbankan, mutasi kas, dan rekap Telegram"
                actions={
                    <button
                        type="button"
                        onClick={fetchSessions}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--rc-panel2)] hover:bg-[var(--rc-border)] border border-[var(--rc-border)] text-xs font-semibold text-[var(--rc-text)] transition-colors cursor-pointer"
                    >
                        <RefreshCw size={14} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
                        <span>Segarkan</span>
                    </button>
                }
            />

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-[var(--rc-panel)] border border-[var(--rc-border)] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--rc-muted)] mb-1">
                            Rentang Tanggal & Jam (WIB)
                        </label>
                        <DateTimePickerRange
                            value={dateRange}
                            onChange={(val) => setDateRange(val)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--rc-muted)] mb-1">
                            Pilih CS
                        </label>
                        <select
                            value={selectedCs}
                            onChange={(e) => setSelectedCs(e.target.value)}
                            className="bg-[var(--rc-bg)] border border-[var(--rc-border)] text-[var(--rc-text)] text-xs rounded-xl px-3 py-2.5 outline-none font-semibold cursor-pointer min-w-36"
                        >
                            <option value="ALL">Semua Petugas CS</option>
                            {staffList.map((st) => (
                                <option key={st.id} value={st.id}>
                                    {st.username} ({st.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--rc-muted)] mb-1">
                            Status Shift
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[var(--rc-bg)] border border-[var(--rc-border)] text-[var(--rc-text)] text-xs rounded-xl px-3 py-2.5 outline-none font-semibold cursor-pointer min-w-32"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="ACTIVE">Aktif</option>
                            <option value="CLOSED">Selesai</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--rc-muted)]">
                        Ditemukan <b>{sessions.length}</b> sesi
                    </span>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBig
                    label="Sesi Shift Aktif"
                    value={String(activeSessionsCount)}
                    sub="Petugas sedang bertugas"
                />
                <StatBig
                    label="Total Transaksi Shift"
                    value={`${totalTrxCount} Trx`}
                    sub="Top Up & WD selesai"
                />
                <StatBig
                    label="Total Perputaran Uang"
                    value={`Rp ${totalMoneyAll.toLocaleString('id-ID')}`}
                    sub="Kas mutasi selama filter"
                />
                <StatBig
                    label="Total Volume Chip"
                    value={`${totalChipAll.toLocaleString('id-ID', { maximumFractionDigits: 2 })} B`}
                    sub="Chip dialirkan ke/dari member"
                />
            </div>

            {/* Sessions Table */}
            <Panel
                title="Daftar Sesi Kerja CS"
                subtitle="Klik pada baris sesi untuk membuka detail utuh (transaksi per bank, transfer, biaya, adjustment, DC bos, dan timeline)"
            >
                {loading ? (
                    <div className="py-16 text-center text-xs text-[var(--rc-muted)]">
                        Memuat riwayat shift CS...
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[var(--rc-muted)]">
                        Tidak ada sesi kerja CS yang sesuai dengan kriteria filter di atas
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--rc-panel2)] text-[var(--rc-muted)] uppercase text-[10px] font-bold tracking-wider border-b border-[var(--rc-border)]">
                                <tr>
                                    <th className="p-3.5">Petugas CS</th>
                                    <th className="p-3.5">Mulai Shift (WIB)</th>
                                    <th className="p-3.5">Selesai Shift (WIB)</th>
                                    <th className="p-3.5">Durasi</th>
                                    <th className="p-3.5">Transaksi (TopUp / WD / Tolak)</th>
                                    <th className="p-3.5 text-right">Nominal Uang</th>
                                    <th className="p-3.5 text-right">Chip</th>
                                    <th className="p-3.5 text-center">Status</th>
                                    <th className="p-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--rc-border)]">
                                {sessions.map((s) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => {
                                            setSelectedSessionId(s.id)
                                            setIsDetailModalOpen(true)
                                        }}
                                        className="hover:bg-[var(--rc-panel2)] transition-colors cursor-pointer group"
                                    >
                                        <td className="p-3.5 font-bold text-[var(--rc-text)]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-[var(--rc-accent)]/10 border border-[var(--rc-accent)]/20 flex items-center justify-center text-[var(--rc-accent)] shrink-0">
                                                    <User size={13} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <div className="font-extrabold">{s.cs_name}</div>
                                                    <div className="text-[10px] text-[var(--rc-muted)] font-normal">{s.cs_role}</div>
                                                </div>
                                                {s.isIdleWarning && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse shrink-0">
                                                        Idle &gt;12j
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3.5 font-mono text-[var(--rc-text2)]">
                                            {formatJakartaDisplay(s.started_at)}
                                        </td>
                                        <td className="p-3.5 font-mono text-[var(--rc-muted)]">
                                            {s.ended_at ? formatJakartaDisplay(s.ended_at) : '— (Berjalan)'}
                                        </td>
                                        <td className="p-3.5 font-semibold text-[var(--rc-accent)] font-mono">
                                            {s.duration?.formatted || '—'}
                                        </td>
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                                <span className="text-emerald-400 font-bold">{s.counts?.topup || 0}</span>
                                                <span className="text-[var(--rc-muted)]">/</span>
                                                <span className="text-blue-400 font-bold">{s.counts?.withdraw || 0}</span>
                                                <span className="text-[var(--rc-muted)]">/</span>
                                                <span className="text-red-400 font-bold">{s.counts?.declined || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                                            Rp {(s.totals?.money || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-3.5 text-right font-mono font-bold text-[var(--rc-accent)]">
                                            {(s.totals?.chip_B || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} B
                                        </td>
                                        <td className="p-3.5 text-center">
                                            {s.status === 'ACTIVE' ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                                    Aktif
                                                </span>
                                            ) : s.status === 'EXPIRED' ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                                                    Expired
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 border border-slate-500/30 text-slate-400">
                                                    Selesai
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--rc-accent)] group-hover:underline">
                                                <span>Rincian</span>
                                                <ChevronRight size={13} strokeWidth={1.5} />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {/* Modal Detail Sesi */}
            <SessionDetailModal
                sessionId={selectedSessionId}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onSessionUpdated={fetchSessions}
                isMaster={true}
            />
        </div>
    )
}
