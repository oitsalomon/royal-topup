'use client'

import { useState } from 'react'
import { Plus, Gamepad2, Edit3, ArrowRightLeft, X, Save, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GameAccount {
    id: number
    game_id: number
    username: string
    role: string
    balance: number
    isActive: boolean
    game: {
        name: string
        code: string
    }
}

interface GameAccountsClientProps {
    initialAccounts: GameAccount[]
}

export default function GameAccountsClient({ initialAccounts }: GameAccountsClientProps) {
    const router = useRouter()
    const [accounts, setAccounts] = useState<GameAccount[]>(initialAccounts)
    const [showForm, setShowForm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Quick Chip Edit Modal State
    const [chipModalAccount, setChipModalAccount] = useState<GameAccount | null>(null)
    const [quickBalance, setQuickBalance] = useState('')
    const [isSavingQuickChip, setIsSavingQuickChip] = useState(false)

    const [formData, setFormData] = useState({
        game_id: '1',
        username: '',
        password: '',
        role: 'ALL',
        balance: ''
    })

    const refreshAccounts = async () => {
        try {
            const res = await fetch('/api/internal/game-accounts')
            const data = await res.json()
            if (Array.isArray(data)) setAccounts(data)
        } catch (error) {
            console.error(error)
        }
    }

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' }
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) headers['X-User-Id'] = String(user.id)
            }
        } catch (e) { }
        return headers
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const url = '/api/internal/game-accounts'
            const method = isEditing ? 'PUT' : 'POST'
            const body = isEditing ? { ...formData, id: editId } : formData

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setShowForm(false)
                refreshAccounts()
                resetForm()
                alert(isEditing ? 'ID Game berhasil diperbarui!' : 'ID Game baru berhasil ditambahkan!')
            } else {
                const err = await res.json().catch(() => ({}))
                alert(`Gagal menyimpan: ${err.error || 'Terjadi kesalahan sistem'}`)
            }
        } catch (error: any) {
            console.error(error)
            alert(`Gagal menyimpan: ${error?.message || 'Koneksi terputus'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (acc: GameAccount) => {
        setFormData({
            game_id: acc.game_id.toString(),
            username: acc.username,
            password: '',
            role: acc.role,
            balance: acc.balance.toString()
        })
        setEditId(acc.id)
        setIsEditing(true)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const resetForm = () => {
        setFormData({
            game_id: '1',
            username: '',
            password: '',
            role: 'ALL',
            balance: ''
        })
        setIsEditing(false)
        setEditId(0)
    }

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        if (!confirm(`Ubah status akun ini menjadi ${!currentStatus ? 'ACTIVE' : 'INACTIVE'}?`)) return
        try {
            const res = await fetch('/api/internal/game-accounts', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            if (res.ok) {
                refreshAccounts()
            } else {
                const err = await res.json().catch(() => ({}))
                alert(`Gagal mengubah status: ${err.error || 'Error'}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    // Quick Chip Modal Handlers
    const openQuickChipModal = (acc: GameAccount) => {
        setChipModalAccount(acc)
        setQuickBalance(acc.balance.toString())
    }

    const handleSaveQuickChip = async () => {
        if (!chipModalAccount) return
        const val = parseFloat(quickBalance.replace(',', '.'))
        if (isNaN(val) || val < 0) {
            alert('Masukkan nominal chip yang valid (minimal 0)')
            return
        }

        setIsSavingQuickChip(true)
        try {
            const res = await fetch('/api/internal/game-accounts', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: chipModalAccount.id,
                    balance: val
                })
            })

            if (res.ok) {
                // Update local state immediately for instant feedback
                setAccounts(prev => prev.map(a => a.id === chipModalAccount.id ? { ...a, balance: val } : a))
                setChipModalAccount(null)
                alert(`Stok chip ${chipModalAccount.username} berhasil diubah menjadi ${val.toLocaleString('id-ID')} B!`)
            } else {
                const err = await res.json().catch(() => ({}))
                alert(`Gagal mengubah stok: ${err.error || 'Terjadi kesalahan'}`)
            }
        } catch (error: any) {
            alert(`Gagal: ${error?.message || 'Koneksi bermasalah'}`)
        } finally {
            setIsSavingQuickChip(false)
        }
    }

    const adjustQuickBalance = (delta: number) => {
        const current = parseFloat(quickBalance.replace(',', '.')) || 0
        const next = Math.max(0, current + delta)
        setQuickBalance(Number(next.toFixed(2)).toString())
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Panel ID Game</h1>
                    <p className="text-gray-400 mt-1">Kelola akun game, peran transaksi, dan stok chip internal</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex items-center gap-2 transition-colors font-semibold"
                >
                    <Plus size={20} />
                    Tambah ID
                </button>
            </div>

            {/* Form Tambah / Edit ID Game */}
            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 border border-purple-500/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">{isEditing ? 'Edit Akun ID Game' : 'Tambah ID Game Baru'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Pilih Game</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
                                value={formData.game_id} onChange={e => setFormData({ ...formData, game_id: e.target.value })}
                            >
                                <option value="1">Royal Dream</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Username / ID Game</label>
                            <input
                                type="text" placeholder="Contoh: 123456789"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 font-mono"
                                value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Password Akun {isEditing && '(Kosongkan jika tidak diganti)'}</label>
                            <input
                                type="text" placeholder={isEditing ? 'Biarkan kosong jika tidak diubah' : 'Password (Opsional)'}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
                                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Role Akun</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
                                value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="ALL">All Role (Top Up & WD)</option>
                                <option value="DEPOSIT">Khusus Top Up (Kirim Chip)</option>
                                <option value="WITHDRAW">Khusus WD (Terima Chip)</option>
                                <option value="GUDANG">Gudang (Penyimpanan)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Nominal Stok Chip (Satuan B - Contoh: 50 atau 1.5)</label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="Nominal Chip dalam B (misal: 100)"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 font-mono"
                                value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })}
                            />
                            {formData.balance && !isNaN(Number(formData.balance)) && (
                                <p className="text-xs text-yellow-400/80 mt-1">
                                    Setara: {Number(formData.balance).toLocaleString('id-ID')} B Chip ({(Number(formData.balance) * 1000).toLocaleString('id-ID')} M)
                                </p>
                            )}
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2 pt-2 border-t border-white/10">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Batal</button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2"
                            >
                                <Save size={16} />
                                {isSubmitting ? 'Menyimpan...' : 'Simpan ID Game'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid List ID Game */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc) => (
                    <div key={acc.id} className="glass p-6 rounded-2xl relative overflow-hidden group border border-white/10 hover:border-purple-500/40 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                                    <Gamepad2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{acc.username}</h3>
                                    <p className="text-xs text-gray-400">{acc.game?.name || 'Royal Dream'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleStatus(acc.id, acc.isActive)}
                                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity ${acc.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}
                            >
                                {acc.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                        </div>

                        <div className="space-y-1 mb-4">
                            <p className="text-xs text-gray-500">ID Game</p>
                            <p className="text-xl font-bold text-white tracking-tight font-mono">{acc.username}</p>

                            {/* Section Stok Chip dengan Tombol Edit Langsung */}
                            <div className="mt-4 p-3 bg-black/40 rounded-xl border border-yellow-500/20 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Stok Chip</p>
                                    <p className="text-2xl font-bold text-yellow-400 font-mono">
                                        {acc.balance.toLocaleString('id-ID')} B
                                    </p>
                                </div>
                                <button
                                    onClick={() => openQuickChipModal(acc)}
                                    className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-yellow-500/30 transition-colors"
                                    title="Edit Nominal Chip Langsung"
                                >
                                    <Edit3 size={13} />
                                    <span>Edit Chip</span>
                                </button>
                            </div>

                            <div className="pt-2">
                                <span className="inline-block text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                                    {acc.role}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                            <button
                                onClick={() => router.push(`/admin/adjustments`)}
                                className="flex-1 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-gray-300"
                                title="Buka Riwayat Mutasi / Penyesuaian"
                            >
                                <ArrowRightLeft size={13} />
                                Mutasi
                            </button>
                            <button
                                onClick={() => handleEdit(acc)}
                                className="flex-1 py-2 text-xs font-medium bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-semibold"
                            >
                                <Edit3 size={13} />
                                Edit ID
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Chip Edit Modal Popup */}
            {chipModalAccount && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="glass bg-[#131417] border border-yellow-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Edit3 size={18} className="text-yellow-400" />
                                    Edit Nominal Stok Chip
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                    ID Game: <span className="text-white font-bold">{chipModalAccount.username}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setChipModalAccount(null)}
                                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Quick Balance Input */}
                        <div className="space-y-2">
                            <label className="block text-xs text-gray-300 font-medium">
                                Jumlah Stok Chip Baru (Satuan B)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    autoFocus
                                    className="w-full bg-black/60 border border-yellow-500/40 rounded-xl px-4 py-3 text-2xl font-bold font-mono text-yellow-400 outline-none focus:border-yellow-400"
                                    value={quickBalance}
                                    onChange={e => setQuickBalance(e.target.value)}
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 font-mono">
                                    B
                                </span>
                            </div>

                            {/* Preview M conversion */}
                            <p className="text-xs text-gray-400">
                                Konversi: <span className="text-yellow-400 font-semibold">{((parseFloat(quickBalance) || 0) * 1000).toLocaleString('id-ID')} M</span> Chip
                            </p>
                        </div>

                        {/* Quick Adjust Buttons (+ / -) */}
                        <div className="space-y-2">
                            <p className="text-[11px] text-gray-400 font-medium">Tombol Penyesuaian Cepat:</p>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(1)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-green-500/20 hover:text-green-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    +1 B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(5)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-green-500/20 hover:text-green-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    +5 B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(10)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-green-500/20 hover:text-green-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    +10 B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(50)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-green-500/20 hover:text-green-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    +50 B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(-1)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    -1 B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(-5)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    -5 B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(-10)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    -10 B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustQuickBalance(-50)}
                                    className="py-1.5 text-xs bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 rounded-lg font-mono font-bold transition-colors"
                                >
                                    -50 B
                                </button>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setChipModalAccount(null)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSavingQuickChip}
                                onClick={handleSaveQuickChip}
                                className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50 transition-all"
                            >
                                <Check size={18} />
                                {isSavingQuickChip ? 'Menyimpan...' : 'Simpan Stok Chip'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

