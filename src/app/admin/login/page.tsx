'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAdminRole } from '@/lib/auth-constants'

export default function AdminLogin() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

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
                router.push('/admin/dashboard')
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

    return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-white/10">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h1>
                {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors cursor-pointer"
                    >
                        {isSubmitting ? 'Memverifikasi...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    )
}
