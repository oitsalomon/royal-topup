'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAdminRole } from '@/lib/auth-constants'
import { formatJakartaDisplay } from '@/lib/timezone'
import { Clock, ShieldCheck, ArrowRight, User } from 'lucide-react'

export default function AdminLogin() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [welcomeModal, setWelcomeModal] = useState<{
        csName: string
        timeWIB: string
        isResumed: boolean
    } | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })

            if (res.ok) {
                const data = await res.json()
                
                // 1. Role Check
                if (!isAdminRole(data.role)) {
                    setError('Unauthorized: Akun ini bukan Staff/Admin.')
                    setIsSubmitting(false)
                    return
                }

                // 2. Save session to localStorage
                localStorage.setItem('user', JSON.stringify(data))
                if (data.theme_preference) {
                    localStorage.setItem('theme_preference', data.theme_preference)
                }

                // 3. Tampilkan Modal Sambutan Shift
                const sessionStartedAt = data.workSession?.started_at || new Date()
                const formattedTime = formatJakartaDisplay(sessionStartedAt)
                setWelcomeModal({
                    csName: data.username,
                    timeWIB: formattedTime,
                    isResumed: Boolean(data.workSession?.isResumed)
                })
            } else {
                const errData = await res.json().catch(() => ({}))
                setError(errData.error || 'Username atau password salah.')
                setIsSubmitting(false)
            }
        } catch (err) {
            setError('Terjadi gangguan koneksi jaringan.')
            setIsSubmitting(false)
        }
    }

    const handleProceedToDashboard = () => {
        router.push('/admin/dashboard')
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0b0d] text-[#f3f5f8] px-4">
            <div className="w-full max-w-md p-8 bg-[#131417] rounded-2xl border border-[#26282f] shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#f5b301]/10 border border-[#f5b301]/30 mx-auto flex items-center justify-center text-[#f5b301] mb-3">
                        <ShieldCheck size={26} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Royal Clover Ops</h1>
                    <p className="text-xs text-[#7e8593] mt-1">Portal Operasional CS & Shift Tracking</p>
                </div>

                {error && (
                    <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-xs font-semibold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#7e8593] uppercase tracking-wider mb-1.5">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-[#0a0b0d] border border-[#26282f] focus:border-[#f5b301] rounded-xl px-4 py-3 text-white outline-none transition-colors"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="cth: Hioza / Salomon"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#7e8593] uppercase tracking-wider mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-[#0a0b0d] border border-[#26282f] focus:border-[#f5b301] rounded-xl px-4 py-3 text-white outline-none transition-colors"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Masukkan password akun"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#f5b301] hover:bg-[#d99e00] disabled:opacity-50 text-[#1a1500] font-black py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#f5b301]/10"
                    >
                        {isSubmitting ? 'Memverifikasi Sesi...' : 'Masuk ke Panel CS'}
                    </button>
                </form>
            </div>

            {/* Modal Sambutan Shift CS */}
            {welcomeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-2xl bg-[#131417] border border-[#26282f] shadow-2xl p-6 space-y-5 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#f5b301]/15 border border-[#f5b301]/30 mx-auto flex items-center justify-center text-[#f5b301]">
                            <Clock size={28} strokeWidth={1.5} />
                        </div>

                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f5b301]/20 text-[#f5b301] border border-[#f5b301]/30">
                                {welcomeModal.isResumed ? 'Sesi Dilanjutkan' : 'Shift Kerja Baru Aktif'}
                            </span>
                            <h2 className="text-xl font-extrabold text-white mt-2">
                                {welcomeModal.isResumed ? 'Melanjutkan Shift Kerja' : `Selamat Bekerja, ${welcomeModal.csName}`}
                            </h2>
                            <p className="text-xs text-[#aab0bc] mt-1.5 leading-relaxed">
                                {welcomeModal.isResumed
                                    ? `Melanjutkan shift yang dimulai ${welcomeModal.timeWIB}. Semua aktivitas Anda akan dicatat di bawah sesi ini.`
                                    : `Shift dimulai ${welcomeModal.timeWIB}. Seluruh transaksi dan mutasi akan tercatat otomatis.`}
                            </p>
                        </div>

                        <div className="p-3.5 bg-[#0a0b0d] border border-[#26282f] rounded-xl text-left space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-[#7e8593]">Petugas CS</span>
                                <span className="font-bold text-white flex items-center gap-1.5">
                                    <User size={13} strokeWidth={1.5} className="text-[#f5b301]" />
                                    {welcomeModal.csName}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#7e8593]">Waktu Mulai Shift</span>
                                <span className="font-mono font-semibold text-emerald-400">
                                    {welcomeModal.timeWIB}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#7e8593]">Status Sesi</span>
                                <span className="font-bold text-emerald-400 uppercase text-[11px]">
                                    Aktif
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleProceedToDashboard}
                            className="w-full py-3 rounded-xl bg-[#f5b301] hover:bg-[#d99e00] text-[#1a1500] font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#f5b301]/10"
                        >
                            <span>Mulai Bekerja</span>
                            <ArrowRight size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

