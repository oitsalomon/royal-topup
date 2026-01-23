'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'
import {
    Users, TrendingUp, Wallet, Copy, Check, Info,
    ChevronDown, ArrowRight, History, Gift, AlertCircle, RefreshCw
} from 'lucide-react'
import { formatIDR } from '@/lib/utils'

export default function ReferralPage() {
    const { user: authUser, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [wdLoading, setWdLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [generatingCode, setGeneratingCode] = useState(false)

    useEffect(() => {
        if (!authLoading && !authUser) {
            router.push('/login')
        }
    }, [authLoading, authUser, router])

    const fetchData = async () => {
        if (!authUser?.id) return
        try {
            setLoading(true)
            const res = await fetch(`/api/members/me?id=${authUser.id}`)
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (err) {
            console.error('Failed to fetch referral data', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [authUser?.id])

    const handleGenerateCode = async () => {
        if (!authUser?.id || generatingCode) return

        try {
            setGeneratingCode(true)
            const res = await fetch('/api/members/generate-referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: authUser.id })
            })

            const result = await res.json()
            if (res.ok && result.success) {
                // Refresh data to show the new code
                fetchData()
            } else {
                alert(result.error || 'Gagal membuat kode referral')
            }
        } catch (err) {
            console.error('Generate code error', err)
            alert('Terjadi kesalahan saat membuat kode.')
        } finally {
            setGeneratingCode(false)
        }
    }

    const copyReferralLink = async () => {
        if (!data?.user?.referral_code) return
        const link = `${window.location.origin}/register?ref=${data.user.referral_code}`

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(link)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } else {
                throw new Error('Clipboard API not available')
            }
        } catch (err) {
            // Fallback for older browsers or non-secure contexts
            try {
                const textArea = document.createElement("textarea")
                textArea.value = link
                textArea.style.position = "fixed" // Avoid scrolling to bottom
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                const successful = document.execCommand('copy')
                document.body.removeChild(textArea)

                if (successful) {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                } else {
                    alert('Gagal menyalin otomatis. Silakan salin manual.')
                }
            } catch (fallbackErr) {
                console.error('Fallback copy failed', fallbackErr)
                alert('Gagal menyalin link. Browser tidak mendukung.')
            }
        }
    }

    const handleWithdrawBonus = async () => {
        if (!authUser?.id) return
        if (wdLoading) return

        setError(null)
        setSuccessMsg(null)
        setWdLoading(true)

        try {
            const res = await fetch('/api/referral/wd-bonus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: authUser.id })
            })

            const result = await res.json()

            if (res.ok) {
                setSuccessMsg(result.message)
                fetchData() // Refresh stats
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memproses penarikan.')
        } finally {
            setWdLoading(false)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#050912]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-cyan-500 text-sm font-bold animate-pulse tracking-widest uppercase">Mempersiapkan Link Cuan...</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    const { user, referralSummary } = data
    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.referral_code}`

    // Validation checks for WD
    const canWd = user.weekly_personal_topup_B >= 1 && user.balance_bonus >= 20000 && !user.wd_bonus_this_week

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#050912]">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Gift className="text-amber-500" />
                            Program Referral
                        </h1>
                        <p className="text-gray-400 mt-2">Undang teman dan dapatkan bonus saldo setiap mereka top up.</p>
                    </div>
                </div>

                {/* Referral Link Card */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3 text-cyan-400 font-bold uppercase tracking-widest text-xs">
                            <ArrowRight size={14} />
                            Link Referral Anda
                        </div>

                        {data.user.referral_code ? (
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-sm text-gray-300 break-all border-dashed">
                                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${data.user.referral_code}`}
                                </div>
                                <button
                                    onClick={copyReferralLink}
                                    className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${copied ? 'bg-emerald-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'}`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Tersalin!' : 'Salin Link'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-start gap-4">
                                <p className="text-sm text-gray-400">Anda belum memiliki kode referral. Klik tombol di bawah untuk membuatnya sekarang.</p>
                                <button
                                    onClick={handleGenerateCode}
                                    disabled={generatingCode}
                                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                >
                                    {generatingCode ? <RefreshCw className="animate-spin" size={18} /> : <Gift size={18} />}
                                    {generatingCode ? 'Membuat Kode...' : 'Buat Kode Referral Saya'}
                                </button>
                            </div>
                        )}

                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                            <Info className="text-amber-500 shrink-0" size={20} />
                            <p className="text-xs text-amber-500/80 leading-relaxed">
                                Bagikan link di atas kepada teman Anda. Bonus akan otomatis masuk ke <strong>Dompet Bonus</strong> setiap kali teman yang Anda undang sukses melakukan Top Up.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl bg-[#161b22] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 text-gray-400 text-sm font-bold">
                            <Users size={18} className="text-blue-500" />
                            Total Referral
                        </div>
                        <div className="text-3xl font-black text-white">{referralSummary.totalReferrals} Orang</div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Teman yang sudah daftar</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-[#161b22] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 text-gray-400 text-sm font-bold">
                            <TrendingUp size={18} className="text-emerald-500" />
                            Volume Referral
                        </div>
                        <div className="text-3xl font-black text-white">{referralSummary.totalVolumeB.toFixed(2)} B</div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Chip yang dibeli teman</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-[#161b22] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 text-gray-400 text-sm font-bold">
                            <Wallet size={18} className="text-amber-500" />
                            Saldo Bonus
                        </div>
                        <div className="text-3xl font-black text-amber-500">{formatIDR(user.balance_bonus)}</div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Siap untuk di WD</p>
                    </div>
                </div>

                {/* Withdraw & Rules Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* WD Bonus Action */}
                    <div className="p-8 rounded-3xl bg-[#161b22] border border-white/5 flex flex-col justify-between space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Penarikan Bonus</h3>
                            <p className="text-sm text-gray-400">Pindahkan saldo bonus ke saldo utama Anda.</p>
                        </div>

                        <div className="space-y-4">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-3">
                                    <Check size={16} />
                                    {successMsg}
                                </div>
                            )}

                            <button
                                onClick={handleWithdrawBonus}
                                disabled={!canWd || wdLoading}
                                className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${canWd ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                            >
                                {wdLoading ? <RefreshCw className="animate-spin" size={20} /> : <Wallet size={20} />}
                                {wdLoading ? 'MEMPROSES...' : 'WD BONUS KE SALDO UTAMA'}
                            </button>

                            {!canWd && !wdLoading && (
                                <p className="text-[10px] text-gray-600 text-center italic">Tombol akan aktif jika semua syarat di bawah terpenuhi.</p>
                            )}
                        </div>
                    </div>

                    {/* Weekly Rules Checklist */}
                    <div className="p-8 rounded-3xl bg-[#161b22]/50 border border-white/5 space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Info size={18} className="text-cyan-500" />
                            Syarat WD Bonus
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                                <span className={`text-sm ${user.weekly_personal_topup_B >= 1 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    Top Up Pribadi (Min 1B)
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-gray-500">{user.weekly_personal_topup_B.toFixed(2)} / 1.00 B</span>
                                    {user.weekly_personal_topup_B >= 1 ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-red-500" />}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                                <span className={`text-sm ${user.balance_bonus >= 20000 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    Minimal Saldo (Rp 20.000)
                                </span>
                                {user.balance_bonus >= 20000 ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-red-500" />}
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                                <span className={`text-sm ${!user.wd_bonus_this_week ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    Jatah WD Minggu Ini (1x)
                                </span>
                                {!user.wd_bonus_this_week ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-red-500" />}
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-500 leading-relaxed italic">
                            * Syarat di atas akan direset setiap hari Senin pukul 00:00 WIB.
                        </p>
                    </div>

                </div>

                {/* Rules Details */}
                <div className="p-8 rounded-3xl bg-[#161b22] border border-white/5 space-y-4">
                    <h3 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                        Cara Kerja Bonus
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-400 leading-relaxed">
                        <ul className="space-y-4 list-disc pl-5">
                            <li>Setiap teman yang menggunakan link Anda akan otomatis terikat sebagai referral Anda selamanya.</li>
                            <li>Anda mendapatkan bonus <strong>Rp 750</strong> untuk setiap <strong>1B</strong> chip yang dibeli teman Anda.</li>
                        </ul>
                        <ul className="space-y-4 list-disc pl-5">
                            <li>Bonus dihitung secara prorata (contoh: 120M -&gt; Rp 90).</li>
                            <li>Bonus hanya cair jika status transaksi teman Anda adalah <strong>SUCCESS</strong>.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    )
}

function X({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
