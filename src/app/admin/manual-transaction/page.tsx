'use client'

import { useState, useEffect } from 'react'
import { ArrowUpCircle, ArrowDownCircle, Save, CheckCircle2 } from 'lucide-react'

interface Game {
    id: number
    name: string
    store_name?: string | null
}

interface Bank {
    id: number
    name: string
    account_number: string
    store_name?: string | null
}

export default function ManualTransactionPage() {
    const [type, setType] = useState<'TOPUP' | 'WITHDRAW'>('TOPUP')
    const [games, setGames] = useState<Game[]>([])
    const [banks, setBanks] = useState<Bank[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        user_wa: '',
        nickname: '',
        game_id: '',
        user_game_id: '', // User's ID inside the game
        amount_chip: '',
        amount_money: '',
        payment_method_id: '',
        note: ''
    })

    useEffect(() => {
        // Fetch Games & Banks on mount
        const init = async () => {
            try {
                const [gRes, bRes] = await Promise.all([
                    fetch('/api/games'),
                    fetch('/api/internal/banks')
                ])
                const gData = await gRes.json()
                const bData = await bRes.json()
                if (Array.isArray(gData)) setGames(gData)
                if (Array.isArray(bData)) setBanks(bData)
            } catch (e) { console.error(e) }
        }
        init()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
            const res = await fetch('/api/internal/manual-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': JSON.parse(localStorage.getItem('user') || '{}').id || '1'
                },
                body: JSON.stringify({
                    type,
                    ...formData,
                    amount_chip: Number(formData.amount_chip),
                    amount_money: Number(formData.amount_money),
                    game_id: Number(formData.game_id),
                    payment_method_id: Number(formData.payment_method_id)
                })
            })

            if (res.ok) {
                setSuccess(true)
                setFormData({
                    user_wa: '',
                    nickname: '',
                    game_id: '',
                    user_game_id: '',
                    amount_chip: '',
                    amount_money: '',
                    payment_method_id: '',
                    note: ''
                })
                alert('Transaksi Manual Berhasil Disimpan!')
            } else {
                const err = await res.json()
                alert('Gagal: ' + err.error)
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan network')
        } finally {
            setLoading(false)
        }
    }

    // Filter Banks based on Selected Game's Store
    const selectedGame = games.find(g => g.id === Number(formData.game_id))
    const filteredBanks = banks.filter(b => {
        if (!selectedGame) return true // Show all if no game selected
        // Show if Bank is Global (null) OR Bank Store == Game Store
        return !b.store_name || b.store_name === selectedGame.store_name
    })

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Input Manual</h1>
                <p className="text-gray-400">Masukan data transaksi dari WhatsApp/Sheet ke Database.</p>
            </div>

            <div className="glass p-8 rounded-3xl border border-white/10">
                {/* Type Switcher */}
                <div className="flex bg-black/40 p-1 rounded-xl mb-8">
                    <button
                        onClick={() => setType('TOPUP')}
                        className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${type === 'TOPUP' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ArrowUpCircle size={20} />
                        Top Up (Masuk)
                    </button>
                    <button
                        onClick={() => setType('WITHDRAW')}
                        className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${type === 'WITHDRAW' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ArrowDownCircle size={20} />
                        Withdraw (Keluar)
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Game Validations */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Pilih Game</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                value={formData.game_id}
                                onChange={e => setFormData({ ...formData, game_id: e.target.value })}
                                required
                            >
                                <option value="">-- Pilih Game --</option>
                                {games.map(g => (
                                    <option key={g.id} value={g.id}>{g.name} {g.store_name ? `(${g.store_name})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">ID User (Game)</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                placeholder="12345678"
                                value={formData.user_game_id}
                                onChange={e => setFormData({ ...formData, user_game_id: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Nickname</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                placeholder="Sultan88"
                                value={formData.nickname}
                                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">No. WhatsApp</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                placeholder="0812..."
                                value={formData.user_wa}
                                onChange={e => setFormData({ ...formData, user_wa: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/5 my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Nominal Chip (Berasal dari M)</label>
                            <input
                                type="number" step="any"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                placeholder="1000 (= 1B)"
                                value={formData.amount_chip}
                                onChange={e => setFormData({ ...formData, amount_chip: e.target.value })}
                                required
                            />
                            <p className="text-xs text-gray-500">Input dalam M (e.g. 1000 = 1B)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Nominal Uang (Rp)</label>
                            <input
                                type="number"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                placeholder="65000"
                                value={formData.amount_money}
                                onChange={e => setFormData({ ...formData, amount_money: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs text-gray-400">Metode Pembayaran (Bank/E-Wallet)</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                value={formData.payment_method_id}
                                onChange={e => setFormData({ ...formData, payment_method_id: e.target.value })}
                                required
                            >
                                <option value="">-- Pilih Bank --</option>
                                {filteredBanks.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} - {b.account_number} {b.store_name ? `(${b.store_name})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs text-gray-400">Catatan Internal (Optional)</label>
                            <textarea
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                rows={2}
                                placeholder="Catatan khusus..."
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-8 transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'}`}
                    >
                        {loading ? 'Menyimpan...' : (
                            <>
                                <Save size={20} />
                                Simpan Transaksi (Selesai)
                            </>
                        )}
                    </button>

                    {success && <p className="text-center text-green-400 mt-2">Data berhasil disimpan!</p>}
                </form>
            </div>
        </div>
    )
}
