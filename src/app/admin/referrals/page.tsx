'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronRight, User, Users, DollarSign, BarChart2, TrendingUp, Wallet } from 'lucide-react'
import { formatChip } from '@/lib/utils'

interface Downline {
    id: number
    username: string
    joinedAt: string
    purchaseVolumeB: number
    bonusGenerated: number
}

interface Referrer {
    id: number
    username: string
    referralCode: string
    totalBonusBalance: number
    downlineCount: number
    downlines: Downline[]
}

export default function AdminReferralsPage() {
    const [referrers, setReferrers] = useState<Referrer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        fetchReferrals()
    }, [])

    const fetchReferrals = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/internal/referrals')
            const data = await res.json()
            if (Array.isArray(data)) {
                setReferrers(data)
            }
        } catch (error) {
            console.error('Failed to fetch referrals:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (id: number) => {
        const newIds = new Set(expandedIds)
        if (newIds.has(id)) newIds.delete(id)
        else newIds.add(id)
        setExpandedIds(newIds)
    }

    const filteredReferrers = referrers.filter(r =>
        r.username.toLowerCase().includes(search.toLowerCase()) ||
        r.referralCode.toLowerCase().includes(search.toLowerCase())
    )

    // Stats
    const totalBonusPayout = referrers.reduce((acc, r) => acc + r.downlines.reduce((acc2, dl) => acc2 + dl.bonusGenerated, 0), 0)
    const totalDownlines = referrers.reduce((acc, r) => acc + r.downlineCount, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2 font-outfit">Monitoring Referral</h1>
                    <p className="text-gray-400">Pantau jaringan downline dan bonus member</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Referrer / Kode..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-[#0f172a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 w-72"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 to-transparent border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users size={64} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                            <Users size={24} />
                        </div>
                        <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Total Jaringan</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{totalDownlines} <span className="text-sm font-normal text-gray-500">Member</span></p>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={64} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Total Bonus Keluar</h3>
                    </div>
                    <p className="text-4xl font-black text-white">Rp {totalBonusPayout.toLocaleString()}</p>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp size={64} className="text-amber-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Referrer Aktif</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{referrers.length} <span className="text-sm font-normal text-gray-500">Akun</span></p>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Referrer (Atasan)</th>
                                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Kode</th>
                                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Downlines</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Saldo Bonus</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-500 font-bold animate-pulse">Menghitung Jaringan...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReferrers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500 font-bold">Belum ada member yang memiliki referral.</td>
                                </tr>
                            ) : (
                                filteredReferrers.map((referrer) => (
                                    <React.Fragment key={referrer.id}>
                                        <tr className={`hover:bg-white/5 transition-all cursor-pointer group ${expandedIds.has(referrer.id) ? 'bg-white/5' : ''}`} onClick={() => toggleExpand(referrer.id)}>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wide">{referrer.username}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Referrer ID #{referrer.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-amber-500 font-mono text-sm font-bold shadow-inner">
                                                    {referrer.referralCode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                                                    <Users size={12} />
                                                    {referrer.downlineCount} Downlines
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-emerald-400 font-mono text-lg font-black">Rp {referrer.totalBonusBalance.toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Saldo Saat Ini</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                                    {expandedIds.has(referrer.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Downlines Section */}
                                        {expandedIds.has(referrer.id) && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-6 bg-black/40 border-y border-white/5">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="h-4 w-1 bg-emerald-500 rounded-full"></div>
                                                            <h4 className="text-sm font-black text-gray-300 uppercase tracking-widest">Daftar Downline {referrer.username}</h4>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {referrer.downlines.map((dl) => (
                                                                <div key={dl.id} className="p-4 rounded-2xl bg-[#161b22] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                                                                    <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:scale-125 transition-transform">
                                                                        <BarChart2 size={64} className="text-white" />
                                                                    </div>

                                                                    <div className="flex items-center gap-3 mb-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                                                                            <User size={18} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-white uppercase tracking-wide">{dl.username}</p>
                                                                            <p className="text-[10px] text-gray-500 font-bold">Join: {new Date(dl.joinedAt).toLocaleDateString('id-ID')}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                                        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                                                            <p className="text-[9px] text-gray-500 font-bold uppercase leading-tight mb-1">Buy Volume</p>
                                                                            <p className="text-sm font-mono font-black text-blue-400">{dl.purchaseVolumeB.toLocaleString()} B</p>
                                                                        </div>
                                                                        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                                                            <p className="text-[9px] text-gray-500 font-bold uppercase leading-tight mb-1">Bonus Hasil</p>
                                                                            <p className="text-sm font-mono font-black text-emerald-400">Rp {dl.bonusGenerated.toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

import React from 'react'
