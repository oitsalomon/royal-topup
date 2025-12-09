'use client'

import { useEffect, useState } from 'react'
import { Coins, ArrowUpRight, ArrowDownLeft, Search, Plus } from 'lucide-react'

export default function AdjustmentHistory() {
    const [adjustments, setAdjustments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [banks, setBanks] = useState<any[]>([])
    const [gameAccounts, setGameAccounts] = useState<any[]>([])

    const [formData, setFormData] = useState({
        targetType: 'SYSTEM', // SYSTEM, BANK, GAME_ACCOUNT
        targetId: '',
        amount_money: '',
        amount_chip: '',
        chip_unit: 'B', // 'B' | 'M'
        action: 'ADD', // ADD, SUBTRACT
        reason: ''
    })

    const fetchAdjustments = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/internal/adjustments')
            const data = await res.json()
            if (Array.isArray(data)) setAdjustments(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchOptions = async () => {
        try {
            const [resBanks, resGames] = await Promise.all([
                fetch('/api/internal/banks'),
                fetch('/api/internal/game-accounts')
            ])
            const dataBanks = await resBanks.json()
            const dataGames = await resGames.json()
            if (Array.isArray(dataBanks)) setBanks(dataBanks)
            if (Array.isArray(dataGames)) setGameAccounts(dataGames)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchAdjustments()
        fetchOptions()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.amount_money && !formData.amount_chip) {
            alert('Isi minimal satu nominal (Uang atau Chip)')
            return
        }

        const requests = []

        if (formData.amount_money) {
            requests.push(fetch('/api/internal/adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'MONEY',
                    action: formData.action,
                    amount: formData.amount_money,
                    note: formData.reason,
                    target_id: formData.targetType === 'BANK' ? formData.targetId : null
                })
            }))
        }

        if (formData.amount_chip) {
            let finalChipAmount = parseFloat(formData.amount_chip)
            if (formData.chip_unit === 'M') {
                finalChipAmount = finalChipAmount / 1000
            }

            requests.push(fetch('/api/internal/adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'CHIP',
                    action: formData.action,
                    amount: finalChipAmount.toString(),
                    note: formData.reason,
                    target_id: formData.targetType === 'GAME_ACCOUNT' ? formData.targetId : null
                })
            }))
        }

        try {
            await Promise.all(requests)
            setShowForm(false)
            fetchAdjustments()
            setFormData({
                targetType: 'SYSTEM',
                targetId: '',
                amount_money: '',
                amount_chip: '',
                chip_unit: 'B',
                action: 'ADD',
                reason: ''
            })
            alert('Adjustment berhasil disimpan')
        } catch (error) {
            console.error(error)
            alert('Gagal menyimpan adjustment')
        }
    }

    const filteredAdjustments = adjustments.filter(a =>
        a.reason?.toLowerCase().includes(search.toLowerCase()) ||
        a.user?.username?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Riwayat Adjustment</h1>
                    <p className="text-gray-400 text-sm mt-1">Catatan penyesuaian saldo manual</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Buat Adjustment
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Cari adjustment..."
                            className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">Buat Adjustment Baru</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-400 mb-1 block">Tipe Target</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                value={formData.targetType}
                                onChange={e => setFormData({ ...formData, targetType: e.target.value, targetId: '' })}
                            >
                                <option value="SYSTEM">System / Admin Balance</option>
                                <option value="BANK">Rekening Bank (Money Only)</option>
                                <option value="GAME_ACCOUNT">Akun Game (Chip Only)</option>
                            </select>
                        </div>

                        {formData.targetType === 'BANK' && (
                            <div className="md:col-span-2">
                                <label className="text-sm text-gray-400 mb-1 block">Pilih Bank</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    value={formData.targetId}
                                    onChange={e => setFormData({ ...formData, targetId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Bank --</option>
                                    {banks.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} - {b.account_number}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {formData.targetType === 'GAME_ACCOUNT' && (
                            <div className="md:col-span-2">
                                <label className="text-sm text-gray-400 mb-1 block">Pilih Akun Game</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    value={formData.targetId}
                                    onChange={e => setFormData({ ...formData, targetId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Akun Game --</option>
                                    {gameAccounts.map(g => (
                                        <option key={g.id} value={g.id}>{g.game?.name} - {g.username}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Aksi</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                value={formData.action}
                                onChange={e => setFormData({ ...formData, action: e.target.value })}
                            >
                                <option value="ADD">Tambah Saldo (+)</option>
                                <option value="SUBTRACT">Kurangi Saldo (-)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Alasan</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                placeholder="Contoh: Koreksi saldo, Bonus, dll"
                                value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                required
                            />
                        </div>

                        {/* Dual Inputs */}
                        <div className={formData.targetType === 'GAME_ACCOUNT' ? 'opacity-50 pointer-events-none' : ''}>
                            <label className="text-sm text-gray-400 mb-1 block">Nominal Uang (M)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white"
                                    value={formData.amount_money}
                                    onChange={e => setFormData({ ...formData, amount_money: e.target.value })}
                                    disabled={formData.targetType === 'GAME_ACCOUNT'}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                            </div>
                        </div>

                        <div className={formData.targetType === 'BANK' ? 'opacity-50 pointer-events-none' : ''}>
                            <label className="text-sm text-gray-400 mb-1 block">Nominal Chip</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    value={formData.amount_chip}
                                    onChange={e => setFormData({ ...formData, amount_chip: e.target.value })}
                                    disabled={formData.targetType === 'BANK'}
                                />
                                <select
                                    className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-yellow-500 font-bold"
                                    value={formData.chip_unit}
                                    onChange={e => setFormData({ ...formData, chip_unit: e.target.value })}
                                    disabled={formData.targetType === 'BANK'}
                                >
                                    <option value="B">B</option>
                                    <option value="M">M</option>
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-400 hover:text-white">Batal</button>
                            <button type="submit" className="px-8 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">Simpan Adjustment</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        {/* Table Header & Body preserved implicitly by replacement if structure matches better, but here I am creating the whole component */}
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Waktu</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Admin</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tipe</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Target</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Alasan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredAdjustments.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Belum ada data adjustment</td></tr>
                            ) : (
                                filteredAdjustments.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">#{item.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{new Date(item.createdAt).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-sm text-white font-medium">{item.user?.username || 'System'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${item.type === 'MONEY' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{item.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {item.bank ? (
                                                <div className="flex flex-col"><span className="text-white font-medium">{item.bank.name}</span><span className="text-xs text-gray-500">{item.bank.account_number}</span></div>
                                            ) : item.gameAccount ? (
                                                <div className="flex flex-col"><span className="text-white font-medium">{item.gameAccount.game?.name}</span><span className="text-xs text-gray-500">{item.gameAccount.username}</span></div>
                                            ) : <span className="text-yellow-400 font-medium">Admin Balance</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm">
                                            <span className={item.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                                                {item.type === 'MONEY'
                                                    ? `${item.amount > 0 ? '+' : ''}Rp ${Math.abs(item.amount).toLocaleString()}`
                                                    : (Math.abs(item.amount) < 1
                                                        ? `${item.amount > 0 ? '+' : '-'}${(Math.abs(item.amount) * 1000).toLocaleString()} M`
                                                        : `${item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toLocaleString()} B`
                                                    )
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{item.reason}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
