'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AlertModal from '@/components/AlertModal'
import { BANKS } from '@/lib/constants/banks'
import { Plus, Trash2, Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react'

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const referralCode = searchParams.get('ref')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

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
                    const activeGames = data.filter((g: any) => g.isActive)
                    setGames(activeGames)

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
            const validGameIds = formData.game_ids.filter(g => g.game_user_id.trim() !== '')

            const payload = {
                ...formData,
                game_ids: validGameIds,
                referral_code: referralCode
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Pendaftaran gagal')
            }

            setAlertState({
                isOpen: true,
                title: 'Registrasi Berhasil!',
                message: 'Akun Anda berhasil dibuat. Mengalihkan ke halaman login...',
                type: 'success'
            })

            setTimeout(() => {
                router.push('/login')
            }, 1800)

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
        <main className="max-w-xl mx-auto px-4 py-8 sm:py-12 font-inter text-[#f3ecd8] antialiased">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block">
                    Pendaftaran Member
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] tracking-tight">
                    Buat Akun Member
                </h1>
                <p className="text-xs text-[#a89f8a]">
                    Daftar untuk menikmati riwayat pesanan otomatis dan promo eksklusif.
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-5 sm:p-7 shadow-sm space-y-7">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Section 1: Info Akun */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#8a6d38]/20">
                            <span className="w-5 h-5 rounded-full bg-[#0d0d0f] border border-[#c5a369] text-[#c5a369] font-poppins font-bold text-xs flex items-center justify-center">
                                1
                            </span>
                            <h2 className="font-poppins font-bold text-sm text-[#f3ecd8]">
                                Informasi Akun Login
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Username <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] outline-none transition-colors placeholder-[#7a766c]"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    placeholder="Username akun"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] outline-none transition-colors placeholder-[#7a766c] pr-10"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        placeholder="Min. 6 karakter"
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

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Nomor WhatsApp <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] font-mono outline-none transition-colors placeholder-[#7a766c]"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    required
                                    placeholder="Contoh: 081234567890"
                                />
                                <p className="text-[11px] text-[#8a6d38] mt-1">
                                    Wajib aktif untuk konfirmasi mutasi dan keamanan akun Anda.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Rekening Bank / E-Wallet */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#8a6d38]/20">
                            <span className="w-5 h-5 rounded-full bg-[#0d0d0f] border border-[#c5a369] text-[#c5a369] font-poppins font-bold text-xs flex items-center justify-center">
                                2
                            </span>
                            <h2 className="font-poppins font-bold text-sm text-[#f3ecd8]">
                                Rekening Bank / E-Wallet Pencairan
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Bank / E-Wallet <span className="text-red-400">*</span>
                                </label>
                                <select
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3 py-2.5 text-xs font-inter text-[#f3ecd8] outline-none transition-colors cursor-pointer"
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
                            </div>

                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    No. Rekening <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] font-mono outline-none transition-colors placeholder-[#7a766c]"
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    required
                                    placeholder="Nomor rekening / HP"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Atas Nama <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] outline-none transition-colors placeholder-[#7a766c] uppercase"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    required
                                    placeholder="Nama pemilik rekening"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: ID Game */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-[#8a6d38]/20">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#0d0d0f] border border-[#c5a369] text-[#c5a369] font-poppins font-bold text-xs flex items-center justify-center">
                                    3
                                </span>
                                <h2 className="font-poppins font-bold text-sm text-[#f3ecd8]">
                                    ID Game (Maksimal 3)
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddGameId}
                                disabled={formData.game_ids.length >= 3}
                                className="px-3 py-1 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/50 hover:border-[#c5a369] text-xs font-poppins font-semibold text-[#e8c883] disabled:opacity-40 transition-colors flex items-center gap-1"
                            >
                                <Plus size={13} />
                                <span>Tambah ID</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.game_ids.map((gid, idx) => (
                                <div key={idx} className="p-3 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/30 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                                            <select
                                                className="bg-[#17171a] border border-[#8a6d38]/40 rounded px-2.5 py-1.5 text-xs text-[#f3ecd8] outline-none cursor-pointer"
                                                value={gid.game_id}
                                                onChange={(e) => handleGameIdChange(idx, 'game_id', e.target.value)}
                                            >
                                                {games.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                className="bg-[#17171a] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded px-2.5 py-1.5 text-base sm:text-xs text-[#f3ecd8] font-mono outline-none placeholder-[#7a766c]"
                                                placeholder="ID Game (Contoh: 123456)"
                                                value={gid.game_user_id}
                                                onChange={(e) => handleGameIdChange(idx, 'game_user_id', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {idx > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveGameId(idx)}
                                                className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                                title="Hapus ID"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-[#17171a] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded px-2.5 py-1.5 text-base sm:text-xs text-[#f3ecd8] outline-none placeholder-[#7a766c]"
                                        placeholder="Nickname Akun Game"
                                        value={gid.nickname || ''}
                                        onChange={(e) => handleGameIdChange(idx, 'nickname', e.target.value)}
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 rounded-md bg-[#3fa46a] hover:bg-[#358a59] disabled:opacity-50 text-white font-poppins font-semibold text-xs sm:text-sm transition-colors text-center shadow-sm"
                        >
                            {isLoading ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
                        </button>
                    </div>
                </form>

                {/* Footer Login Link */}
                <div className="pt-4 border-t border-[#8a6d38]/20 text-center">
                    <p className="text-xs text-[#a89f8a]">
                        Sudah memiliki akun?{' '}
                        <Link href="/login" className="text-[#c5a369] hover:text-[#e8c883] font-semibold underline transition-colors">
                            Login Disini
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

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#8a6d38] border-t-[#c5a369] rounded-full animate-spin"></div>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    )
}
