'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Search, User, Trophy, Wallet, ArrowDownLeft, ArrowUpRight,
    ChevronLeft, ChevronRight, Phone, Users, Clock, Crown, UserPlus,
    AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react'
import {
    PageHead, Panel, StatBig
} from '@/components/admin/RoyalCloverUI'
import { rp, num } from '@/lib/clover-engine'
import DateTimePickerRange, { DateTimeRangeValue } from '@/components/admin/DateTimePickerRange'
import { getJakartaTodayRange, parseJakartaDateTime } from '@/lib/timezone'

export default function MembersCRMPage() {
    const today = getJakartaTodayRange()
    const [dateRange, setDateRange] = useState<DateTimeRangeValue>({
        startDateStr: today.startDateStr,
        startTimeStr: today.startTimeStr,
        endDateStr: today.endDateStr,
        endTimeStr: today.endTimeStr
    })

    const [q, setQ] = useState('')
    const [localQ, setLocalQ] = useState('')
    const [view, setView] = useState('all')
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>({
        members: [],
        top5: [],
        total: 1584,
        totalPages: 53,
        stats: {
            totalDatabase: 1584,
            activeMembers: 0,
            totalFollowUp: 0,
            totalVipFollowUp: 0,
            totalRareBuyer: 0,
            totalTopNom: 0,
            totalWdNom: 0,
            netNom: 0
        }
    })

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localQ !== q) {
                setQ(localQ)
                setPage(1)
            }
        }, 350)
        return () => clearTimeout(timer)
    }, [localQ, q])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const startUTC = parseJakartaDateTime(dateRange.startDateStr, dateRange.startTimeStr)
            const endUTC = new Date(parseJakartaDateTime(dateRange.endDateStr, dateRange.endTimeStr).getTime() + 59999)

            const params = new URLSearchParams({
                q: q.trim(),
                view,
                startDate: startUTC.toISOString(),
                endDate: endUTC.toISOString(),
                page: String(page),
                limit: '30'
            })

            const res = await fetch(`/api/admin/members/crm?${params}`)
            const json = await res.json()
            if (json.success) {
                setData(json)
            }
        } catch (err) {
            console.error('Error fetching CRM data:', err)
        } finally {
            setLoading(false)
        }
    }, [q, view, page, dateRange])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Reset date range
    const handleResetDate = () => {
        const t = getJakartaTodayRange()
        setDateRange({
            startDateStr: t.startDateStr,
            startTimeStr: t.startTimeStr,
            endDateStr: t.endDateStr,
            endTimeStr: t.endTimeStr
        })
        setPage(1)
    }

    // B3 Tabs: Short labels with counters and Lucide icons (Zero emojis)
    const tabs = [
        {
            key: 'all',
            label: `Semua (${data.stats?.totalDatabase || 1584})`,
            icon: <Users size={16} strokeWidth={1.5} className="text-[#c5a369]" />
        },
        {
            key: 'follow_up',
            label: `Jarang Top Up (${data.stats?.totalFollowUp || 0})`,
            icon: <Clock size={16} strokeWidth={1.5} className="text-[#c5a369]" />
        },
        {
            key: 'vip_dormant',
            label: `VIP Follow Up (${data.stats?.totalVipFollowUp || 0})`,
            icon: <Crown size={16} strokeWidth={1.5} className="text-[#c5a369]" />
        },
        {
            key: 'rare_buyer',
            label: `Baru (${data.stats?.totalRareBuyer || 0})`,
            icon: <UserPlus size={16} strokeWidth={1.5} className="text-[#c5a369]" />
        },
        {
            key: 'top_buyer',
            label: 'Sering TU',
            icon: <ArrowUpRight size={16} strokeWidth={1.5} className="text-[#c5a369]" />
        },
        {
            key: 'top_wd',
            label: 'Sering WD',
            icon: <ArrowDownLeft size={16} strokeWidth={1.5} className="text-[#c5a369]" />
        },
        {
            key: 'net_spender',
            label: 'Net Besar',
            icon: <Wallet size={16} strokeWidth={1.5} className="text-[#c5a369]" />
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header & Date Range Picker */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <PageHead
                    crumbs={['Member', 'CRM Database']}
                    title="Member Database & CRM"
                    sub="Monitoring frekuensi transaksi, follow up CS, dan auto-detect Royal ID vs WhatsApp"
                />
                <div className="w-full lg:w-auto flex items-center justify-start lg:justify-end">
                    <DateTimePickerRange
                        value={dateRange}
                        onChange={(newRange) => {
                            setDateRange(newRange)
                            setPage(1)
                        }}
                        onReset={handleResetDate}
                    />
                </div>
            </div>

            {/* B1: Stat Cards for Active Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBig
                    label="Member Aktif Periode Ini"
                    value={`${data.stats?.activeMembers || 0} Member`}
                    sub={`Dari total ${data.stats?.totalDatabase || 1584} member`}
                    delta="Aktif"
                    deltaUp={true}
                />
                <StatBig
                    label="Volume Top Up Periode Ini"
                    value={rp(data.stats?.totalTopNom || 0)}
                    sub="Total transaksi deposit masuk"
                    delta="Top Up"
                    deltaUp={true}
                />
                <StatBig
                    label="Volume WD Periode Ini"
                    value={rp(data.stats?.totalWdNom || 0)}
                    sub="Total withdraw disetujui"
                    delta="Withdraw"
                    deltaUp={false}
                />
                <StatBig
                    label="Net Turnover Periode Ini"
                    value={`${(data.stats?.netNom || 0) >= 0 ? '+' : ''}${rp(data.stats?.netNom || 0)}`}
                    sub="Selisih Top Up - WD"
                    delta={(data.stats?.netNom || 0) >= 0 ? 'Surplus' : 'Defisit'}
                    deltaUp={(data.stats?.netNom || 0) >= 0}
                />
            </div>

            {/* Top 5 Spenders in Active Period */}
            <Panel title="Top 5 Spender Periode Aktif" subtitle="Member dengan akumulasi deposit terbesar di periode ini">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {(data.top5 || []).map((m: any, idx: number) => {
                        const isNo1 = idx === 0
                        return (
                            <div
                                key={m.wa || idx}
                                className={`p-3.5 rounded-2xl border transition-all ${
                                    isNo1
                                        ? 'bg-[#c5a369]/10 border-[#c5a369]/40 shadow-lg shadow-[#c5a369]/5'
                                        : 'bg-[#17171a] border-[#26282f]'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                                            isNo1
                                                ? 'bg-[#c5a369] text-black font-bold'
                                                : 'bg-[#1b1d22] text-[#d6dae1]'
                                        }`}
                                    >
                                        {isNo1 ? <Trophy size={14} /> : `#${idx + 1}`}
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#c5a369]/20 text-[#c5a369]">
                                        VIP
                                    </span>
                                </div>

                                <div className="mt-2.5">
                                    <div className="text-xs font-extrabold text-[#f3f5f8] truncate">
                                        {m.nick && m.nick !== '—' ? m.nick : `Member ${m.wa?.slice(-4)}`}
                                    </div>
                                    <div className="text-[10px] text-[#7e8593] truncate font-mono">{m.wa}</div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-[#26282f]">
                                    <div className="text-xs font-black text-[#c5a369]">{rp(m.top_nom)}</div>
                                    <div className="text-[10px] text-[#7e8593]">{num(m.top_chip)} B Chip</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Panel>

            {/* B3: Segmentation Tabs (Uniform 40px height, shrink-0, whitespace-nowrap, smooth horizontal scroll) */}
            <div className="space-y-3">
                <div className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center gap-2 min-w-max">
                        {tabs.map((tab) => {
                            const isActive = view === tab.key
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        setView(tab.key)
                                        setPage(1)
                                    }}
                                    className={`h-10 px-4 shrink-0 whitespace-nowrap rounded-xl text-xs font-medium flex items-center gap-2 transition-all border ${
                                        isActive
                                            ? 'bg-[#c5a369] text-black border-[#c5a369] font-bold shadow-md shadow-[#c5a369]/10'
                                            : 'bg-[#17171a] text-gray-400 border-white/10 hover:border-[#c5a369]/40 hover:text-white'
                                    }`}
                                >
                                    <span className={isActive ? 'text-black' : 'text-[#c5a369]'}>
                                        {tab.icon}
                                    </span>
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* B2: Search Box on Separate Line (min-w 280px, auto-detect Royal ID vs WA vs Nickname) */}
                <div className="relative w-full max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={localQ}
                        onChange={(e) => setLocalQ(e.target.value)}
                        placeholder="Cari Royal ID / Nomor WA / Nickname..."
                        className="w-full min-w-[280px] bg-[#17171a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-xs outline-none focus:border-[#c5a369] transition-colors"
                    />
                </div>
            </div>

            {/* Members Table */}
            <Panel
                title="Daftar Member Royal Clover"
                subtitle={`Menampilkan ${data.members?.length || 0} dari total ${data.total || 0} member`}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#26282f] text-[#7e8593] font-bold uppercase tracking-wider">
                                <th className="p-3">Rank</th>
                                <th className="p-3">Member / Nick</th>
                                <th className="p-3">WhatsApp</th>
                                <th className="p-3">ID Game (Royal ID)</th>
                                <th className="p-3 text-right">Top Up (Rp)</th>
                                <th className="p-3 text-right">WD (Rp)</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Aksi CS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26282f]/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-[#7e8593]">
                                        <div className="w-8 h-8 border-2 border-[#c5a369] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        Memuat database member...
                                    </td>
                                </tr>
                            ) : data.members?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-[#7e8593]">
                                        Tidak ditemukan member yang cocok dengan filter atau pencarian &quot;{q}&quot;
                                    </td>
                                </tr>
                            ) : (
                                data.members?.map((m: any, idx: number) => {
                                    const rankNum = (page - 1) * 30 + idx + 1
                                    const cleanWa = String(m.wa || '').replace(/[^0-9]/g, '')
                                    const memberName = m.nick && m.nick !== '—' ? m.nick : 'bos'
                                    const waText = encodeURIComponent(`Halo kak ${memberName}! Apa kabar? Ada promo spesial koin chip Royal Clover nih buat kakak hari ini. Mau top up koin berapa B hari ini?`)
                                    const waLink = cleanWa ? `https://wa.me/${cleanWa}?text=${waText}` : '#'

                                    const isVip = (m.top_nom >= 3000000 || m.tier === 'VIP')
                                    const isNeedFollowUp = (m.days_since != null && m.days_since >= 14) || (m.top_count != null && m.top_count <= 2)

                                    return (
                                        <tr key={m.wa || idx} className="hover:bg-[#1b1d22]/50 transition-colors">
                                            <td className="p-3 font-bold text-[#7e8593]">
                                                {rankNum <= 3 ? (
                                                    <span className="w-5 h-5 rounded-full bg-[#c5a369]/20 text-[#c5a369] inline-flex items-center justify-center text-[10px]">
                                                        {rankNum}
                                                    </span>
                                                ) : (
                                                    `#${rankNum}`
                                                )}
                                            </td>
                                            <td className="p-3 font-bold text-[#f3f5f8]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-[#1b1d22] flex items-center justify-center text-[#c5a369]">
                                                        <User size={13} />
                                                    </div>
                                                    <div>
                                                        <div>{m.nick && m.nick !== '—' ? m.nick : '—'}</div>
                                                        <div className="text-[10px] text-[#7e8593] font-normal font-mono">
                                                            {m.top_count || 0}× Topup · {m.wd_count || 0}× WD
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-[#d6dae1]">{m.wa}</td>
                                            <td className="p-3 text-[#d6dae1] max-w-xs truncate" title={m.game_ids}>
                                                <span className="font-mono text-[11px] text-[#c5a369] font-medium">
                                                    {m.game_ids || '—'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="font-bold text-emerald-400">{rp(m.top_nom)}</div>
                                                <div className="text-[10px] text-[#7e8593]">{num(m.top_chip)} B</div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="font-bold text-red-400">{rp(m.wd_nom)}</div>
                                                <div className="text-[10px] text-[#7e8593]">{num(m.wd_chip)} B</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                {isVip && isNeedFollowUp ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                                                        <Crown size={12} className="text-amber-400" />
                                                        VIP Follow Up ({m.days_since != null ? `${m.days_since}h lalu` : 'Pasif'})
                                                    </span>
                                                ) : isNeedFollowUp ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                                                        <AlertCircle size={12} className="text-orange-400" />
                                                        Follow Up ({m.days_since != null ? `${m.days_since}h lalu` : 'Jarang'})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                                        <CheckCircle2 size={12} className="text-emerald-400" />
                                                        Aktif ({m.days_since != null ? `${m.days_since}h lalu` : 'Baru'})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {cleanWa ? (
                                                    <a
                                                        href={waLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all shadow-xs"
                                                        title="Chat WhatsApp untuk Follow Up Promo"
                                                    >
                                                        <Phone size={12} />
                                                        <span>Chat WA</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-600 text-[10px]">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-[#26282f] text-xs">
                    <span className="text-[#7e8593]">
                        Halaman <b className="text-white">{page}</b> dari <b className="text-white">{data.totalPages || 1}</b>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-lg bg-[#1b1d22] border border-[#26282f] text-[#d6dae1] disabled:opacity-40 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={14} className="inline mr-1" /> Prev
                        </button>
                        <button
                            type="button"
                            disabled={page >= data.totalPages}
                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            className="px-3 py-1.5 rounded-lg bg-[#1b1d22] border border-[#26282f] text-[#d6dae1] disabled:opacity-40 hover:text-white transition-colors"
                        >
                            Next <ChevronRight size={14} className="inline ml-1" />
                        </button>
                    </div>
                </div>
            </Panel>
        </div>
    )
}

