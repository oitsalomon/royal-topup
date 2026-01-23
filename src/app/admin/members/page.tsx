'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, User, Trophy, Wallet, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatChip } from '@/lib/utils'

interface Member {
    id: number
    username: string
    level: string
    weeklyStats: any[]
    _count: { gameIds: number }
    created_at?: string // Some DB clients map lowercase, Prisma usually CamelCase. Handling both.
    createdAt?: string
    lastLogin?: string | null
    lastActivity?: string | null // string because it comes from JSON API
    totalTopUp: number
    totalWithdraw: number
    loyalty_points: number
}

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [levelFilter, setLevelFilter] = useState('')
    const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, activeMembersToday: 0 })

    useEffect(() => {
        fetchMembers()
    }, [page, search, levelFilter])

    const fetchMembers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
                level: levelFilter
            })
            const res = await fetch(`/api/internal/members?${params}`)
            const data = await res.json()
            if (data.members) {
                setMembers(data.members)
                setTotalPages(data.pagination.pages)
                if (data.stats) setStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to fetch members', error)
        } finally {
            setLoading(false)
        }
    }

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'BRONZE': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
            case 'SILVER': return 'text-gray-300 bg-gray-400/10 border-gray-400/20'
            case 'GOLD': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
            case 'DIAMOND': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Manajemen Member</h1>
                    <p className="text-gray-400">Daftar pengguna terdaftar Clover Store</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50"
                    >
                        <option value="">Semua Level</option>
                        <option value="BRONZE">Bronze</option>
                        <option value="SILVER">Silver</option>
                        <option value="GOLD">Gold</option>
                        <option value="DIAMOND">Diamond</option>
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Cari Username / Nama Rek / No Rek / WA..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#0f172a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 w-72"
                        />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-[#0f172a]/60 backdrop-blur-sm border border-white/5 hover:border-blue-500/30 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <User size={20} />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-full">Total</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-white tracking-tight">{stats.totalMembers.toLocaleString()}</h3>
                                <p className="text-sm text-gray-400">Terdaftar</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#0f172a]/60 backdrop-blur-sm border border-white/5 hover:border-emerald-500/30 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                    <Trophy size={20} />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-emerald-500/50 bg-emerald-500/5 px-2 py-1 rounded-full">Mingguan</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-white tracking-tight">{stats.activeMembers.toLocaleString()}</h3>
                                <p className="text-sm text-gray-400">Member Aktif</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#0f172a]/60 backdrop-blur-sm border border-white/5 hover:border-violet-500/30 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2.5 bg-violet-500/10 rounded-lg text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-violet-500/50 bg-violet-500/5 px-2 py-1 rounded-full">Harian</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-white tracking-tight">{stats.activeMembersToday.toLocaleString()}</h3>
                                <p className="text-sm text-gray-400">Online Hari Ini</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>



            <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Level</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Loyalty Points</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total Depo</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bongkar</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Turnover (Minggu Ini)</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Last Activity</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Tidak ada member ditemukan</td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-white text-sm">{member.username}</p>
                                                        {member.totalTopUp === 0 && member.totalWithdraw > 2000000 && (
                                                            <div className="group/alert relative">
                                                                <div className="p-1 rounded bg-red-500/10 text-red-500 cursor-pointer animate-pulse">
                                                                    <Shield size={12} />
                                                                </div>
                                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-red-500 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/alert:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                    Suspicious: High WD (Rp {member.totalWithdraw.toLocaleString()}) without Deposit
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">Joined: {new Date(member.created_at || member.createdAt || new Date().toISOString()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelColor(member.level)}`}>
                                                {member.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-amber-400 font-mono text-sm font-bold">
                                                {member.loyalty_points?.toLocaleString('id-ID') || 0}
                                                <Trophy size={14} className="text-amber-500/50" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-emerald-400 font-mono text-sm font-bold">
                                                Rp {member.totalTopUp?.toLocaleString('id-ID') || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-rose-400 font-mono text-sm font-bold">
                                                Rp {member.totalWithdraw?.toLocaleString('id-ID') || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-white font-mono text-sm">
                                                {formatChip(member.weeklyStats[0]?.total_turnover || 0)}
                                                <Wallet size={14} className="text-gray-400" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-gray-400 text-xs font-mono block">
                                                {member.lastActivity ? new Date(member.lastActivity).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                }) : '-'}
                                            </span>
                                            {member.lastActivity && <span className="text-[10px] text-gray-600">Last Active</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/members/${member.id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all"
                                            >
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-sm text-gray-400">Halaman {page} dari {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 disabled:opacity-50 hover:bg-white/10"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 disabled:opacity-50 hover:bg-white/10"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
