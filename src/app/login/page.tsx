'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthProvider'
import AlertModal from '@/components/AlertModal'
import { Eye, EyeOff, User, Lock, ArrowLeft } from 'lucide-react'

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
                throw new Error(data.error || 'Login gagal')
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
        <main className="max-w-md mx-auto px-4 py-8 sm:py-14 font-inter text-[#f3ecd8] antialiased">
            {/* Header / Title */}
            <div className="text-center space-y-2 mb-6">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block">
                    Area Member
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] tracking-tight">
                    Login Member
                </h1>
                <p className="text-xs text-[#a89f8a]">
                    Masuk ke akun Anda untuk cek transaksi, level, dan cashback.
                </p>
            </div>

            {/* Login Card */}
            <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-6 sm:p-7 shadow-sm space-y-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Input */}
                    <div>
                        <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1.5">
                            Username <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] outline-none transition-colors placeholder-[#7a766c]"
                                placeholder="Masukkan username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1.5">
                            Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] outline-none transition-colors placeholder-[#7a766c] pr-10"
                                placeholder="Masukkan password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89f8a] hover:text-[#f3ecd8] transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 rounded-md bg-[#3fa46a] hover:bg-[#358a59] disabled:opacity-50 text-white font-poppins font-semibold text-xs sm:text-sm transition-colors text-center shadow-sm"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
                        </button>
                    </div>
                </form>

                {/* Footer Register Link */}
                <div className="pt-4 border-t border-[#8a6d38]/20 text-center">
                    <p className="text-xs text-[#a89f8a]">
                        Belum memiliki akun member?{' '}
                        <Link href="/register" className="text-[#c5a369] hover:text-[#e8c883] font-semibold underline transition-colors">
                            Daftar Sekarang
                        </Link>
                    </p>
                </div>
            </div>

            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
            />
        </main>
    )
}
