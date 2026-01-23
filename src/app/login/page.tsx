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
        <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="relative bg-[#161b22]/80 backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                            Login Member
                        </h1>
                        <p className="text-gray-400 text-sm">Masuk untuk cek Level & Cashback</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Username
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
                                placeholder="Masukkan username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono pr-10"
                                    placeholder="Masukkan password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-gray-400 text-sm">
                                Belum punya akun?{' '}
                                <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
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
