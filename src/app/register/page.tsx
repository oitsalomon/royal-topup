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
        <div className="pt-24 pb-20 px-4 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <div className="v4-glass p-8 md:p-12 rounded-[32px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="text-center mb-12 relative z-10">
                        <h1 className="v4-font-syne text-4xl font-extrabold text-white mb-3 uppercase tracking-tight">
                            Daftar <span className="v4-text-gradient">Member</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">Dapatkan Cashback & Tiket Undian Mingguan!</p>

                        <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                            <div className="flex gap-3 items-start text-left">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                    🚀
                                </div>
                                <div>
                                    <h3 className="text-amber-500 text-xs font-black uppercase tracking-widest mb-1">Migrasi Sistem Versi 4.0</h3>
                                    <p className="text-gray-400 text-[11px] leading-relaxed font-medium">
                                        Seluruh member lama <span className="text-white font-bold underline">Wajib Daftar Ulang</span> untuk mengaktifkan fitur TRX ID Otomatis. Saldo & Level akan disesuaikan kembali oleh Admin setelah pendaftaran.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {referralCode && (
                            <div className="mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <UserPlus size={14} />
                                Referral Aktif: {referralCode}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                        {/* Section 1: Akun */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-black text-sm">1</div>
                                <h3 className="v4-font-syne text-lg font-bold text-white uppercase tracking-wider">Info Akun</h3>
                                <div className="flex-1 h-px bg-white/5"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Username</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all v4-font-mono font-medium"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        placeholder="Min. 3 karakter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all v4-font-mono font-medium pr-14"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-2"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest flex items-center justify-between">
                                        WhatsApp (WA)
                                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">Wajib Aktif</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 outline-none transition-all v4-font-mono font-medium"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        required
                                        placeholder="Contoh: 081234567890"
                                    />
                                    <p className="text-[10px] text-gray-600 mt-2 font-medium italic">
                                        *Berguna untuk info Cashback & Event Mingguan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Bank */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-sm">2</div>
                                <h3 className="v4-font-syne text-lg font-bold text-white uppercase tracking-wider">Rekening Cashback</h3>
                                <div className="flex-1 h-px bg-white/5"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Bank / E-Wallet</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white hover:border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                            required
                                        >
                                            <option value="">Pilih Bank</option>
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
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                                            ▼
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">No. Rekening</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all v4-font-mono font-medium"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        required
                                        placeholder="12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Atas Nama</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all font-bold text-sm uppercase"
                                        value={formData.account_name}
                                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                        required
                                        placeholder="Sesuai Bank"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Game IDs */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 font-black text-sm">3</div>
                                    <h3 className="v4-font-syne text-lg font-bold text-white uppercase tracking-wider">ID Game (Max 3)</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddGameId}
                                    disabled={formData.game_ids.length >= 3}
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 disabled:opacity-30 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3" /> Tambah ID
                                </button>
                            </div>

                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight italic mb-4">ID yang didaftarkan akan otomatis terhitung Turn Over & Cashback</p>

                            <div className="space-y-4">
                                {formData.game_ids.map((gid, idx) => (
                                    <div key={idx} className="flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/5 group/item animate-in fade-in slide-in-from-right-4">
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all appearance-none cursor-pointer font-bold text-xs"
                                                        value={gid.game_id}
                                                        onChange={(e) => handleGameIdChange(idx, 'game_id', e.target.value)}
                                                    >
                                                        {games.map((g: any) => (
                                                            <option key={g.id} value={g.id}>{g.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">▼</div>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all v4-font-mono font-medium text-sm"
                                                    placeholder="ID Game (Contoh: 123456)"
                                                    value={gid.game_user_id}
                                                    onChange={(e) => handleGameIdChange(idx, 'game_user_id', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all font-bold text-sm uppercase"
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
                                                className="w-14 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 flex items-center justify-center hover:text-white transition-all group-hover/item:border-red-500/30"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-6 v4-btn-main rounded-[24px] font-black text-white shadow-2xl shadow-purple-500/30 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 text-base tracking-widest uppercase"
                            >
                                {isLoading ? 'Memproses...' : 'Buat Akun Sekarang'}
                            </button>
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                Sudah punya akun?{' '}
                                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    )
}
