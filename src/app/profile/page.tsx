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
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [authLoading, user, router])

    useEffect(() => {
        if (user?.id) {
            fetchStats()
        }
    }, [user?.id])

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/members/me?id=${user?.id}`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch stats', error)
        } finally {
            setLoading(false)
        }
    }

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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#050912]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-amber-500 text-sm font-bold animate-pulse tracking-widest uppercase">Memuat Data Sultan...</p>
                </div>
            </div>
        )
    }

    if (!stats) return null

    const { user: userData, gameIds } = stats

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
    const nextLevelExp = 10000000 // Example fixed target
    const progressPercent = Math.min((userData.total_exp / nextLevelExp) * 100, 100)

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#050912]">
            <div className="max-w-md md:max-w-5xl mx-auto space-y-8">

                {/* 1. THE "SULTAN" MEMBER CARD */}
                <div className={`relative overflow-hidden rounded-3xl p-8 border backdrop-blur-xl shadow-2xl transition-all hover:scale-[1.02] duration-500 group ${style.cardBg} ${style.border}`}>
                    {/* Background Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-200%] group-hover:animate-shine" />
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

                        {/* User Info */}
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md`}>
                                {style.icon}
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Welcome Back,</p>
                                <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-2">
                                    {userData.username}
                                    {userData.level === 'DIAMOND' && <Sparkles size={20} className="text-cyan-400 animate-pulse" />}
                                </h1>
                                <div className={`inline-flex px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-xs font-bold ${style.text}`}>
                                    {userData.level} MEMBER
                                </div>
                            </div>
                        </div>

                        {/* Exp / Stats / Progress */}
                        <div className="w-full md:w-auto min-w-[250px]">
                            <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                                <span>EXP Progress</span>
                                <span>{Math.floor(progressPercent)}% to Next Level</span>
                            </div>
                            <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className={`h-full ${style.progress} shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 text-right">Total Transaksi: Rp {userData.total_exp.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* 2. QUICK ACTIONS (The "Easy" Part) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => router.push('/profile/loyalty')}
                        className="group relative p-6 rounded-3xl bg-[#161b22] border border-white/5 hover:bg-emerald-600 transition-all duration-300 overflow-hidden text-left"
                    >
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all" />
                        <div className="relative z-10">
                            <div className="mb-4">
                                <Trophy className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Loyalty Point</h3>
                            <p className="text-xs text-gray-500 group-hover:text-white/80">Tukar Hadiah</p>
                        </div>
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="group relative p-6 rounded-3xl bg-[#161b22] border border-white/5 hover:bg-emerald-600 transition-all duration-300 overflow-hidden text-left"
                    >
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all" />
                        <Gamepad2 className="w-8 h-8 text-emerald-500 group-hover:text-white mb-4 transition-colors" />
                        <h3 className="text-lg font-bold text-white mb-1">Top Up Game</h3>
                        <p className="text-xs text-gray-500 group-hover:text-white/80">Diskon Kilat</p>
                    </button>

                    <button
                        onClick={() => router.push('/check-transaction')}
                        className="group relative p-6 rounded-3xl bg-[#161b22] border border-white/5 hover:bg-blue-500 transition-all duration-300 overflow-hidden text-left"
                    >
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all" />
                        <History className="w-8 h-8 text-blue-500 group-hover:text-white mb-4 transition-colors" />
                        <h3 className="text-lg font-bold text-white mb-1">Riwayat</h3>
                        <p className="text-xs text-gray-500 group-hover:text-white/80">Cek Status</p>
                    </button>

                    <button
                        className="group relative p-6 rounded-3xl bg-[#161b22] border border-white/5 hover:bg-purple-500 transition-all duration-300 overflow-hidden text-left cursor-not-allowed opacity-70"
                    >
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all" />
                        <Wallet className="w-8 h-8 text-purple-500 group-hover:text-white mb-4 transition-colors" />
                        <h3 className="text-lg font-bold text-white mb-1">Deposit</h3>
                        <p className="text-xs text-gray-500 group-hover:text-white/80">Coming Soon</p>
                    </button>

                    <button
                        onClick={handleWhatsAppHelp}
                        className="group relative p-6 rounded-3xl bg-[#161b22] border border-white/5 hover:bg-amber-500 transition-all duration-300 overflow-hidden text-left"
                    >
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all" />
                        <Headphones className="w-8 h-8 text-amber-500 group-hover:text-white mb-4 transition-colors" />
                        <h3 className="text-lg font-bold text-white mb-1">Bantuan CS</h3>
                        <p className="text-xs text-gray-500 group-hover:text-white/80">24 Jam Online</p>
                    </button>

                </div>

                {/* 3. INFO & SETTINGS Section (Split Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Saved IDs */}
                    <div className="md:col-span-2 p-6 rounded-3xl bg-[#161b22] border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <CreditCard size={20} className="text-cyan-500" />
                                ID Game Tersimpan
                            </h3>
                            <button className="text-xs text-cyan-400 hover:text-cyan-300 font-bold border border-cyan-500/20 px-3 py-1 rounded-lg">
                                + Tambah Baru
                            </button>
                        </div>

                        <div className="space-y-3">
                            {gameIds.map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-cyan-900/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{g.game_user_id}</p>
                                            <p className="text-xs text-gray-500">{g.game_name} • {g.nickname || 'No Nickname'}</p>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-red-500/10 rounded-full text-red-500 transition-colors">
                                            <LogOut size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {gameIds.length === 0 && (
                                <div className="text-center py-8 text-gray-500 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    <p>Belum ada ID game yang tersimpan.</p>
                                    <p className="text-xs mt-1">ID akan otomatis tersimpan setelah Top Up.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Settings / Logout */}
                    <div className="p-6 rounded-3xl bg-[#161b22] border border-white/5 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <Crown size={20} className="text-amber-500" />
                                Info Akun
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Nomor WhatsApp</p>
                                    <p className="text-white font-mono">{userData.user_wa || '-'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Rekening Bank</p>
                                    <p className="text-white font-bold">{userData.bank_name}</p>
                                    <p className="text-sm text-gray-400 font-mono">{userData.account_number}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="mt-8 w-full py-4 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold transition-all flex items-center justify-center gap-2 border border-red-500/20"
                        >
                            <LogOut size={18} />
                            Keluar Akun
                        </button>
                    </div>

                </div>

            </div>
        </div >
    )
}
