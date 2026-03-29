'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'
import {
    Trophy, ShieldCheck, Wallet, Gamepad2, CheckCircle, Crown,
    Info, Sparkles, History, CreditCard, Headphones, LogOut,
    ChevronRight, Star
} from 'lucide-react'
import { formatChip } from '@/lib/utils'

export default function ProfilePage() {
    const { user, isLoading: authLoading, logout } = useAuth()
    const router = useRouter()

    // Use local state for extended stats (like referralSummary, weeklyStats if needed in future)
    // But for now, use "user" from context for instant render
    const [extendedStats, setExtendedStats] = useState<any>(null)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [authLoading, user, router])

    // Optional: Fetch fresh extended stats in background (non-blocking)
    useEffect(() => {
        if (user?.id) {
            fetch(`/api/members/me?id=${user.id}`).then(res => res.json()).then(data => setExtendedStats(data)).catch(console.error)
        }
    }, [user?.id])

    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error(err))
    }, [])

    const handleWhatsAppHelp = () => {
        const waNumber = config?.contacts?.whatsapp?.number
        if (waNumber) {
            let num = waNumber.replace(/[^0-9]/g, '')
            if (num.startsWith('0')) num = '62' + num.slice(1)
            window.open(`https://wa.me/${num}`, '_blank')
        } else {
            window.open('https://wa.me/6281234567890', '_blank')
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#050912]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-amber-500 text-sm font-bold animate-pulse tracking-widest uppercase">Memuat Data Sultan...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    // Merge context user with extended stats if available
    const userData = { ...user, ...(extendedStats?.user || {}) }
    const gameIds = extendedStats?.gameIds || user.gameIds || []

    // Helper for Level Styling
    const getLevelStyle = (level: string) => {
        switch (level) {
            case 'DIAMOND': return {
                cardBg: 'bg-gradient-to-br from-cyan-900 via-blue-900 to-black',
                border: 'border-cyan-500/50',
                text: 'text-cyan-400',
                progress: 'bg-cyan-500',
                icon: <Crown className="w-8 h-8 text-cyan-400 animate-pulse" />
            }
            case 'PLATINUM': return {
                cardBg: 'bg-gradient-to-br from-fuchsia-900 via-purple-900 to-black',
                border: 'border-fuchsia-500/50',
                text: 'text-fuchsia-400',
                progress: 'bg-fuchsia-500',
                icon: <Trophy className="w-8 h-8 text-fuchsia-400" />
            }
            case 'GOLD': return {
                cardBg: 'bg-gradient-to-br from-yellow-800 via-amber-900 to-black',
                border: 'border-amber-500/50',
                text: 'text-amber-400',
                progress: 'bg-amber-500',
                icon: <Trophy className="w-8 h-8 text-amber-400" />
            }
            default: return { // SILVER / BRONZE
                cardBg: 'bg-gradient-to-br from-slate-800 via-gray-900 to-black',
                border: 'border-slate-500/50',
                text: 'text-slate-300',
                progress: 'bg-slate-400',
                icon: <ShieldCheck className="w-8 h-8 text-slate-400" />
            }
        }
    }

    const style = getLevelStyle(userData.level)

    // Calculate Progress to Next Level (Mock logic for visual)
    let progressPercent = 0
    if (extendedStats?.levelProgress?.percent !== undefined) {
        progressPercent = extendedStats.levelProgress.percent
    } else {
        const nextLevelExp = 10000000 
        progressPercent = Math.min((userData.total_exp / nextLevelExp) * 100, 100)
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* 1. THE "SULTAN" MEMBER CARD */}
                <div className="v4-glass rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                    {/* Animated Glow Background */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-600/20 transition-all duration-1000" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-600/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 group-hover:bg-cyan-600/20 transition-all duration-1000" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">

                        {/* User Info */}
                        <div className="flex items-center gap-8">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center shadow-2xl backdrop-blur-md relative z-10 group-hover:scale-110 transition-transform duration-500">
                                    {style.icon}
                                </div>
                                <div className="absolute -inset-4 bg-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Sultan Dashboard</p>
                                <h1 className="v4-font-syne text-4xl md:text-5xl font-black text-white tracking-tight mb-4 flex items-center gap-4">
                                    {userData.username}
                                    {userData.level === 'DIAMOND' && <Sparkles size={24} className="text-cyan-400 animate-pulse" />}
                                </h1>
                                <div className="inline-flex px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black tracking-[0.2em] text-purple-400 uppercase">
                                    {userData.level} TIER MEMBER
                                </div>
                            </div>
                        </div>

                        {/* Exp / Stats / Progress */}
                        <div className="w-full md:w-auto min-w-[320px] bg-black/20 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <div className="flex justify-between items-end mb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Level Progress</p>
                                    <p className="v4-font-syne text-xl font-black text-white">{Math.floor(progressPercent)}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">To Next Tier</p>
                                    <p className="v4-font-mono text-cyan-400 font-bold uppercase text-[10px]">RP {(10000000 - userData.total_exp).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/5">
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Total Transaksi</span>
                                <span className="v4-font-mono text-xs font-bold text-white tracking-widest">RP {userData.total_exp.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. QUICK ACTIONS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <button
                        onClick={() => router.push('/profile/loyalty')}
                        className="v4-glass group relative p-8 rounded-[32px] hover:bg-emerald-500/10 transition-all duration-500 overflow-hidden text-left border-white/5 hover:border-emerald-500/30"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Trophy className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="v4-font-syne text-lg font-black text-white mb-2 uppercase tracking-tight">Loyalty</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Tukar Hadiah</p>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="v4-glass group relative p-8 rounded-[32px] hover:bg-purple-500/10 transition-all duration-500 overflow-hidden text-left border-white/5 hover:border-purple-500/30"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Gamepad2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="v4-font-syne text-lg font-black text-white mb-2 uppercase tracking-tight">Top Up</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-purple-400 transition-colors">Diskon Kilat</p>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/check-transaction')}
                        className="v4-glass group relative p-8 rounded-[32px] hover:bg-cyan-500/10 transition-all duration-500 overflow-hidden text-left border-white/5 hover:border-cyan-500/30"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <History className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="v4-font-syne text-lg font-black text-white mb-2 uppercase tracking-tight">Riwayat</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-cyan-400 transition-colors">Cek Status</p>
                        </div>
                    </button>

                    <button
                        onClick={handleWhatsAppHelp}
                        className="v4-glass group relative p-8 rounded-[32px] hover:bg-amber-500/10 transition-all duration-500 overflow-hidden text-left border-white/5 hover:border-amber-500/30"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Headphones className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="v4-font-syne text-lg font-black text-white mb-2 uppercase tracking-tight">Bantuan</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors">CS 24 Jam</p>
                        </div>
                    </button>
                </div>

                {/* 3. INFO & SETTINGS Section (Split Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Saved IDs */}
                    <div className="v4-glass md:col-span-2 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <h3 className="v4-font-syne text-xl font-extrabold text-white flex items-center gap-4 uppercase tracking-widest">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                                    <CreditCard size={20} />
                                </div>
                                ID Game <span className="v4-text-gradient">Tersimpan</span>
                            </h3>
                            <button className="text-[10px] font-black text-cyan-400 hover:text-white transition-colors border border-cyan-500/20 px-5 py-2.5 rounded-2xl hover:bg-cyan-500/20 uppercase tracking-widest">
                                + Tambah Baru
                            </button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {gameIds.map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-6 rounded-[24px] bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all group/item hover:bg-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center text-white text-xs font-black border border-white/10 group-hover/item:border-purple-500/30">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="v4-font-mono text-lg font-black text-white group-hover/item:text-purple-400 transition-colors tracking-widest">{g.game_user_id}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{g.game_name} • <span className="text-cyan-400/70">{g.nickname || 'NO NICKNAME'}</span></p>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <button className="p-3 bg-red-500/10 hover:bg-red-500 rounded-2xl text-red-500 hover:text-white transition-all border border-red-500/20">
                                            <LogOut size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {gameIds.length === 0 && (
                                <div className="text-center py-16 text-gray-500 bg-black/40 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center gap-4">
                                    <Gamepad2 size={40} className="text-gray-700" />
                                    <div>
                                        <p className="v4-font-sy its text-lg font-black text-gray-600 uppercase tracking-tight">Belum Ada ID Game</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">ID akan otomatis tersimpan setelah Top Up.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Settings / Logout */}
                    <div className="v4-glass p-10 rounded-[40px] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10 w-full">
                            <h3 className="v4-font-syne text-xl font-extrabold text-white flex items-center gap-4 uppercase tracking-widest mb-10">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                    <Crown size={20} />
                                </div>
                                Detail <span className="v4-text-gradient">Akun</span>
                            </h3>
                            
                            <div className="space-y-5">
                                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 hover:border-purple-500/20 transition-all">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">WhatsApp Connected</p>
                                    <p className="v4-font-mono text-white font-black tracking-widest">{userData.user_wa || '-'}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 hover:border-purple-500/20 transition-all">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Bank / Wallet Detail</p>
                                    <p className="text-white font-black v4-font-syne uppercase tracking-tight mb-1">{userData.bank_name}</p>
                                    <p className="v4-font-mono text-xs text-purple-400 font-bold tracking-[0.2em]">{userData.account_number}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="relative z-10 mt-12 w-full py-5 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black text-[10px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 border border-red-500/20 group/logout"
                        >
                            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                            Keluar Akun
                        </button>
                    </div>

                </div>

            </div>
        </div >
    )
}
