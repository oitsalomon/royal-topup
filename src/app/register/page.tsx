'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AlertModal from '@/components/AlertModal'
import { BANKS } from '@/lib/constants/banks'
import { Plus, Trash2, Eye, EyeOff, UserPlus } from 'lucide-react'

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const referralCode = searchParams.get('ref')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [step, setStep] = useState(1) // 1: Account, 2: Bank, 3: Game IDs

    const [formData, setFormData] = useState({
        username: '',
        whatsapp: '',
        password: '',
        bank_name: '',
        account_number: '',
        account_name: '',
        game_ids: [{ game_id: '2', game_user_id: '', nickname: '' }] // Default Royal Dream
    })

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

    const [games, setGames] = useState<any[]>([])

    // Fetch games on mount
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const res = await fetch('/api/games')
                const data = await res.json()
                if (data && Array.isArray(data)) {
                    // Only show active games
                    const activeGames = data.filter((g: any) => g.isActive)
                    setGames(activeGames)

                    // Set default game ID if available
                    if (activeGames.length > 0) {
                        setFormData(prev => ({
                            ...prev,
                            game_ids: [{ game_id: String(activeGames[0].id), game_user_id: '', nickname: '' }]
                        }))
                    }
                }
            } catch (error) {
                console.error('Failed to fetch games', error)
            }
        }
        fetchGames()
    }, [])

    const handleAddGameId = () => {
        if (formData.game_ids.length >= 3) return
        setFormData({
            ...formData,
            game_ids: [...formData.game_ids, { game_id: games[0]?.id ? String(games[0].id) : '', game_user_id: '', nickname: '' }]
        })
    }

    const handleRemoveGameId = (index: number) => {
        const newIds = [...formData.game_ids]
        newIds.splice(index, 1)
        setFormData({ ...formData, game_ids: newIds })
    }

    const handleGameIdChange = (index: number, field: string, value: string) => {
        const newIds = [...formData.game_ids]
        newIds[index] = { ...newIds[index], [field]: value }
        setFormData({ ...formData, game_ids: newIds })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Filter empty game IDs
            const validGameIds = formData.game_ids.filter(g => g.game_user_id.trim() !== '')

            const payload = {
                ...formData,
                game_ids: validGameIds,
                referral_code: referralCode // Add the referral code from the URL
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            setAlertState({
                isOpen: true,
                title: 'Registrasi Berhasil!',
                message: 'Akun Anda berhasil dibuat. Silakan login.',
                type: 'success'
            })

            // Redirect after delay
            setTimeout(() => {
                router.push('/login')
            }, 2000)

        } catch (error: any) {
            setAlertState({
                isOpen: true,
                title: 'Registrasi Gagal',
                message: error.message,
                type: 'error'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <div className="relative bg-[#161b22]/80 backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                            Daftar Member Royal (Trusted)
                        </h1>
                        <p className="text-gray-400 text-sm">Dapatkan Cashback & Tiket Undian Mingguan!</p>

                        {referralCode && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-pulse">
                                <UserPlus size={14} />
                                Referral Aktif: {referralCode}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Akun */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">1. Info Akun</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Username</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        placeholder="Min. 3 karakter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none pr-10"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            placeholder="Rahasia"
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
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase flex items-center gap-2">
                                        WhatsApp (WA)
                                        <span className="text-[10px] normal-case bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                                            Wajib Aktif untuk Info Hadiah Member
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 outline-none"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        required
                                        placeholder="Contoh: 0812xxx (Berguna untuk info Cashback & Event)"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1 italic">
                                        *Nomor WA yang valid akan mendapatkan prioritas info Event Cashback & Hadiah Mingguan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Bank (Required for Cashback) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">
                                2. Rekening Cashback <span className="text-xs font-normal text-gray-400 ml-2">(Wajib Valid)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Bank / E-Wallet</label>
                                    <select
                                        className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Bank / E-Wallet</option>
                                        <optgroup label="E-Wallet">
                                            {BANKS.filter(b => b.category === 'EWALLET').map(b => (
                                                <option key={b.code} value={b.code}>{b.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Bank Populer">
                                            {BANKS.filter(b => b.category === 'BANK').map(b => (
                                                <option key={b.code} value={b.code}>{b.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Bank Digital">
                                            {BANKS.filter(b => b.category === 'DIGITAL').map(b => (
                                                <option key={b.code} value={b.code}>{b.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Nomor Rekening</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        required
                                        placeholder="Contoh: 1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Atas Nama</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                        value={formData.account_name}
                                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                        required
                                        placeholder="Sesuai Buku Tabungan"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Game IDs */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <h3 className="text-lg font-bold text-white">3. ID Game (Max 3)</h3>
                                <button
                                    type="button"
                                    onClick={handleAddGameId}
                                    disabled={formData.game_ids.length >= 3}
                                    className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Tambah ID
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 italic">ID yang didaftarkan akan otomatis terhitung Turn Over & Cashback</p>

                            <div className="space-y-3">
                                {formData.game_ids.map((gid, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="w-1/3">
                                            <select
                                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none"
                                                value={gid.game_id}
                                                onChange={(e) => handleGameIdChange(idx, 'game_id', e.target.value)}
                                            >
                                                {games.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                                placeholder="ID Game (Contoh: 123456)"
                                                value={gid.game_user_id}
                                                onChange={(e) => handleGameIdChange(idx, 'game_user_id', e.target.value)}
                                                required
                                            />
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                                placeholder="Nickname (Wajib Valid)"
                                                value={gid.nickname || ''}
                                                onChange={(e) => handleGameIdChange(idx, 'nickname', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {idx > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveGameId(idx)}
                                                className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 max-h-[50px]"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                        >
                            {isLoading ? 'Memproses...' : 'Buat Akun Sekarang'}
                        </button>

                        <div className="text-center">
                            <p className="text-gray-400 text-sm">
                                Sudah punya akun?{' '}
                                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                                    Login Disini
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

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050912]">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    )
}
