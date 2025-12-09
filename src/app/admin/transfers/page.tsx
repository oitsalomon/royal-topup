'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Search, ArrowRight } from 'lucide-react'

export default function TransferHistory() {
    const [transfers, setTransfers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [banks, setBanks] = useState<any[]>([])
    const [gameAccounts, setGameAccounts] = useState<any[]>([])

    // Form State
    const [type, setType] = useState('MONEY') // MONEY, CHIP
    const [sourceId, setSourceId] = useState('')
    const [targetId, setTargetId] = useState('')
    const [amount, setAmount] = useState('')
    const [chipUnit, setChipUnit] = useState('B') // 'B' | 'M'
    const [note, setNote] = useState('')

    const fetchTransfers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/internal/transfers')
            const data = await res.json()
            if (Array.isArray(data)) setTransfers(data)
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
        fetchTransfers()
        fetchOptions()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Convert if Chip + M unit
            let finalAmount = parseFloat(amount)
            if (type === 'CHIP' && chipUnit === 'M') {
                finalAmount = finalAmount / 1000
            }

            const res = await fetch('/api/internal/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    source_id: sourceId,
                    target_id: targetId,
                    amount: finalAmount.toString(),
                    note
                })
            })
            const data = await res.json()
            if (res.ok) {
                setShowForm(false)
                fetchTransfers()
                setAmount('')
                setNote('')
                setChipUnit('B')
                alert('Transfer berhasil!')
            } else {
                alert(data.error || 'Transfer gagal')
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan system')
        }
    }

    const filteredTransfers = transfers.filter(t =>
        t.note?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Riwayat Transfer</h1>
                    <p className="text-gray-400 text-sm mt-1">Catatan pemindahan aset antar akun</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <TrendingUp size={20} />
                        Buat Transfer
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Cari transfer..."
                            className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">Transfer Aset Baru</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="md:col-span-2 flex gap-4 mb-2">
                            <label className={`flex-1 p-3 rounded-xl border cursor-pointer text-center font-bold transition-all ${type === 'MONEY' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                                <input type="radio" name="type" value="MONEY" checked={type === 'MONEY'} onChange={() => { setType('MONEY'); setSourceId(''); setTargetId('') }} className="hidden" />
                                Transfer Uang (Bank)
                            </label>
                            <label className={`flex-1 p-3 rounded-xl border cursor-pointer text-center font-bold transition-all ${type === 'CHIP' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                                <input type="radio" name="type" value="CHIP" checked={type === 'CHIP'} onChange={() => { setType('CHIP'); setSourceId(''); setTargetId('') }} className="hidden" />
                                Transfer Chip (Game)
                            </label>
                        </div>

                        {type === 'MONEY' ? (
                            <>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Dari Bank</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={sourceId} onChange={e => setSourceId(e.target.value)} required>
                                        <option value="">-- Pilih Sumber --</option>
                                        {banks.map(b => <option key={b.id} value={b.id}>{b.name} - Rp {b.balance.toLocaleString()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Ke Bank</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={targetId} onChange={e => setTargetId(e.target.value)} required>
                                        <option value="">-- Pilih Tujuan --</option>
                                        {banks.filter(b => b.id.toString() !== sourceId).map(b => <option key={b.id} value={b.id}>{b.name} - {b.account_number}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Dari Akun Game</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={sourceId} onChange={e => setSourceId(e.target.value)} required>
                                        <option value="">-- Pilih Sumber --</option>
                                        {gameAccounts.map(g => <option key={g.id} value={g.id}>{g.game?.name} - {g.username} ({g.balance.toLocaleString()} B)</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Ke Akun Game</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={targetId} onChange={e => setTargetId(e.target.value)} required>
                                        <option value="">-- Pilih Tujuan --</option>
                                        {gameAccounts.filter(g => g.id.toString() !== sourceId).map(g => <option key={g.id} value={g.id}>{g.game?.name} - {g.username}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-400 mb-1 block">Nominal {type === 'MONEY' ? 'Uang' : 'Chip'}</label>
                            {type === 'MONEY' ? (
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">Rp</span>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                    />
                                    <select
                                        className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-yellow-500 font-bold"
                                        value={chipUnit}
                                        onChange={e => setChipUnit(e.target.value)}
                                    >
                                        <option value="B">B</option>
                                        <option value="M">M</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-400 mb-1 block">Catatan</label>
                            <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Optional" value={note} onChange={e => setNote(e.target.value)} />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-400 hover:text-white">Batal</button>
                            <button type="submit" className="px-8 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600">Transfer Sekarang</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        {/* Header preserved */}
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Waktu</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tipe</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Dari</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider"></th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ke</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading data...</td></tr>
                            ) : filteredTransfers.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Belum ada data transfer</td></tr>
                            ) : (
                                filteredTransfers.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">#{item.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{new Date(item.createdAt).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${item.type === 'MONEY' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'}`}>{item.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {item.fromBank ? <div className="flex flex-col"><span className="text-white font-medium">{item.fromBank.name}</span><span className="text-xs text-gray-500">{item.fromBank.account_number}</span></div>
                                                : item.fromGameAccount ? <div className="flex flex-col"><span className="text-white font-medium">{item.fromGameAccount.game?.name}</span><span className="text-xs text-gray-500">{item.fromGameAccount.username}</span></div>
                                                    : <span className="text-gray-500">Unknown</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600"><ArrowRight size={14} className="mx-auto" /></td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {item.toBank ? <div className="flex flex-col"><span className="text-white font-medium">{item.toBank.name}</span><span className="text-xs text-gray-500">{item.toBank.account_number}</span></div>
                                                : item.toGameAccount ? <div className="flex flex-col"><span className="text-white font-medium">{item.toGameAccount.game?.name}</span><span className="text-xs text-gray-500">{item.toGameAccount.username}</span></div>
                                                    : <span className="text-gray-500">Unknown</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm text-white font-bold">
                                            {item.type === 'MONEY'
                                                ? `Rp ${item.amount.toLocaleString()}`
                                                : (item.amount < 1
                                                    ? `${(item.amount * 1000).toLocaleString()} M`
                                                    : `${item.amount.toLocaleString()} B`
                                                )
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{item.note || '-'}</td>
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
