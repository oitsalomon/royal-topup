'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Trophy, ShieldCheck, Wallet, Gamepad2, CheckCircle, Crown,
    Sparkles, History, CreditCard, Headphones, LogOut,
    ExternalLink
} from 'lucide-react'

export default function ProfilePage() {
    const { user, isLoading: authLoading, logout } = useAuth()
    const router = useRouter()
    const [extendedStats, setExtendedStats] = useState<any>(null)
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [authLoading, user, router])

    useEffect(() => {
        if (user?.id) {
            fetch(`/api/members/me?id=${user.id}`)
                .then(res => res.json())
                .then(data => setExtendedStats(data))
                .catch(console.error)
        }
    }, [user?.id])

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
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-[#8a6d38] border-t-[#c5a369] rounded-full animate-spin"></div>
                    <p className="text-xs font-poppins font-semibold text-[#c5a369] tracking-wider uppercase">Memuat Profil...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    const userData = { ...user, ...(extendedStats?.user || {}) }
    const gameIds = extendedStats?.gameIds || user.gameIds || []
    const totalExp = userData.total_exp ?? 0

    let progressPercent = 0
    if (extendedStats?.levelProgress?.percent !== undefined) {
        progressPercent = extendedStats.levelProgress.percent
    } else {
        const nextLevelExp = 10000000
        progressPercent = Math.min((totalExp / nextLevelExp) * 100, 100)
    }

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num)
    }

    return (
        <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6 font-inter text-[#f3ecd8] antialiased">
            {/* Header Member Profile */}
            <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-[#0d0d0f] border border-[#8a6d38]/60 flex items-center justify-center text-[#c5a369]">
                            <Crown size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-poppins font-bold text-[#f3ecd8]">
                                    {userData.username}
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-poppins font-bold bg-[#0d0d0f] border border-[#c5a369] text-[#e8c883]">
                                    {userData.level || 'MEMBER'}
                                </span>
                            </div>
                            <p className="text-xs text-[#a89f8a] mt-1">
                                WhatsApp: <span className="font-mono text-[#f3ecd8]">{userData.whatsapp || userData.user_wa || '-'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Level Progress */}
                    <div className="w-full md:w-72 bg-[#0d0d0f] p-4 rounded-lg border border-[#8a6d38]/30 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#a89f8a]">Progress Tier</span>
                            <span className="font-poppins font-bold text-[#e8c883]">{Math.floor(progressPercent)}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#17171a] rounded-full overflow-hidden border border-[#8a6d38]/20">
                            <div
                                className="h-full bg-[#c5a369] rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#a89f8a] pt-1">
                            <span>Total Transaksi</span>
                            <span className="font-mono text-[#f3ecd8] font-semibold">{formatRupiah(totalExp)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link
                    href="/"
                    className="bg-[#17171a] hover:bg-[#202024] border border-[#8a6d38]/35 hover:border-[#c5a369] rounded-lg p-4 transition-all group"
                >
                    <div className="w-9 h-9 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/40 flex items-center justify-center text-[#c5a369] mb-3 group-hover:border-[#c5a369]">
                        <Gamepad2 size={18} />
                    </div>
                    <h2 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">Top Up Chip</h2>
                    <p className="text-[11px] text-[#a89f8a]">Beli koin resmi</p>
                </Link>

                <Link
                    href="/withdraw/royal-dream"
                    className="bg-[#17171a] hover:bg-[#202024] border border-[#8a6d38]/35 hover:border-[#c5a369] rounded-lg p-4 transition-all group"
                >
                    <div className="w-9 h-9 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/40 flex items-center justify-center text-[#3fa46a] mb-3 group-hover:border-[#3fa46a]">
                        <Wallet size={18} />
                    </div>
                    <h2 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">Bongkaran</h2>
                    <p className="text-[11px] text-[#a89f8a]">Tukar koin ke uang</p>
                </Link>

                <Link
                    href="/check-transaction"
                    className="bg-[#17171a] hover:bg-[#202024] border border-[#8a6d38]/35 hover:border-[#c5a369] rounded-lg p-4 transition-all group"
                >
                    <div className="w-9 h-9 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/40 flex items-center justify-center text-[#e8c883] mb-3 group-hover:border-[#e8c883]">
                        <History size={18} />
                    </div>
                    <h2 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">Riwayat</h2>
                    <p className="text-[11px] text-[#a89f8a]">Status pesanan</p>
                </Link>

                <button
                    type="button"
                    onClick={handleWhatsAppHelp}
                    className="bg-[#17171a] hover:bg-[#202024] border border-[#8a6d38]/35 hover:border-[#c5a369] rounded-lg p-4 transition-all text-left group"
                >
                    <div className="w-9 h-9 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/40 flex items-center justify-center text-[#c5a369] mb-3 group-hover:border-[#c5a369]">
                        <Headphones size={18} />
                    </div>
                    <h2 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">Bantuan CS</h2>
                    <p className="text-[11px] text-[#a89f8a]">Chat 24 jam</p>
                </button>
            </div>

            {/* Content Details: Game IDs & Bank Account */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Saved Game IDs */}
                <div className="md:col-span-2 bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#8a6d38]/20">
                        <h2 className="font-poppins font-bold text-sm text-[#f3ecd8] flex items-center gap-2">
                            <CreditCard size={16} className="text-[#c5a369]" />
                            ID Game Tersimpan
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {gameIds.map((g: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3.5 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/30">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded bg-[#17171a] border border-[#8a6d38]/40 flex items-center justify-center text-xs font-bold text-[#c5a369]">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-mono font-bold text-[#f3ecd8]">{g.game_user_id}</p>
                                        <p className="text-xs text-[#a89f8a]">{g.game_name || 'Royal Dream'} • <span className="text-[#c5a369]">{g.nickname || 'Tanpa Nickname'}</span></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {gameIds.length === 0 && (
                            <div className="text-center py-8 text-[#a89f8a] text-xs">
                                <Gamepad2 size={28} className="mx-auto text-[#8a6d38] mb-2" />
                                <p>Belum ada ID game yang tersimpan.</p>
                                <p className="text-[11px] text-[#8a6d38]">ID otomatis tersimpan saat Anda melakukan transaksi.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bank / E-Wallet Info & Logout */}
                <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div className="pb-3 border-b border-[#8a6d38]/20">
                            <h2 className="font-poppins font-bold text-sm text-[#f3ecd8]">
                                Rekening Pencairan
                            </h2>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/30">
                                <span className="text-[11px] text-[#a89f8a] block">Bank / E-Wallet</span>
                                <p className="font-poppins font-bold text-sm text-[#f3ecd8] mt-0.5">{userData.bank_name || '-'}</p>
                            </div>
                            <div className="p-3 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/30">
                                <span className="text-[11px] text-[#a89f8a] block">Nomor Rekening</span>
                                <p className="font-mono text-xs text-[#c5a369] font-bold mt-0.5">{userData.account_number || '-'}</p>
                            </div>
                            <div className="p-3 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/30">
                                <span className="text-[11px] text-[#a89f8a] block">Atas Nama</span>
                                <p className="font-poppins font-bold text-xs text-[#f3ecd8] uppercase mt-0.5">{userData.account_name || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full py-2.5 rounded-md bg-[#3a3a3f] hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/40 border border-[#8a6d38]/30 text-[#a89f8a] font-poppins font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={14} />
                        <span>Keluar Akun</span>
                    </button>
                </div>
            </div>
        </main>
    )
}
