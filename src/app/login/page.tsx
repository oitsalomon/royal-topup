'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthProvider'
import AlertModal from '@/components/AlertModal'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [formData, setFormData] = useState({ username: '', password: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [alertState, setAlertState] = useState<{
        isOpen: boolean
        title: string
        message: string
        type: 'success' | 'error' | 'info'
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })

    const router = useRouter()
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Login failed')
            }

            // Login Success
            login(data)
            router.push('/')

        } catch (error: any) {
            setAlertState({
                isOpen: true,
                title: 'Login Gagal',
                message: error.message,
                type: 'error'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="pt-16 pb-12 sm:pt-24 sm:pb-20 px-4 flex items-center justify-center min-h-[85vh]">
            <div className="w-full max-w-md">
                <div className="v4-glass p-6 sm:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="text-center mb-8 sm:mb-10 relative z-10">
                        <h1 className="v4-font-syne text-3xl sm:text-4xl font-extrabold text-white mb-2 sm:mb-3 uppercase tracking-tight">
                            Login <span className="v4-text-gradient">Member</span>
                        </h1>
                        <p className="text-gray-500 text-[11px] sm:text-sm font-medium">Masuk untuk cek Level & Cashback</p>
                    </div>

                    <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl relative z-10">
                        <div className="flex gap-3 items-start text-left">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                🔔
                            </div>
                            <div>
                                <h3 className="text-amber-500 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1">Sertifikasi Sistem Baru</h3>
                                <p className="text-gray-400 text-[10px] sm:text-[11px] leading-relaxed font-medium">
                                    Kami telah memperbarui sistem ke <span className="text-white">Versi 4.0</span>. Seluruh member lama diwajibkan untuk <Link href="/register" className="text-amber-500 font-bold underline">Daftar Ulang</Link> agar bisa menikmati fitur TRX ID baru.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
                        <div>
                            <label className="block text-[9px] sm:text-[10px] font-bold text-gray-500 mb-2 sm:mb-3 uppercase tracking-widest">
                                Username
                            </label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all v4-font-mono text-sm font-medium"
                                placeholder="Masukkan username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] sm:text-[10px] font-bold text-gray-500 mb-2 sm:mb-3 uppercase tracking-widest">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all v4-font-mono text-sm font-medium pr-14"
                                    placeholder="Masukkan password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-2"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 sm:py-5 v4-btn-main rounded-2xl font-black text-white shadow-xl shadow-purple-500/20 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 text-xs sm:text-sm tracking-widest uppercase"
                            >
                                {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
                            </button>
                        </div>

                        <div className="text-center mt-6 sm:mt-8">
                            <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                Belum punya akun?{' '}
                                <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                    Daftar Disini
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
            />
        </div>
    )
}
