'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Coins, AlertCircle, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function AdminDashboard() {
    const [data, setData] = useState<any>({
        banks: [],
        gameAccounts: [],
        pendingCount: 0,
        dailyStats: {
            topup: { count: 0, money_in: 0, chip_out: 0 },
            withdraw: { count: 0, money_out: 0, chip_in: 0 }
        }
    })
    const [loading, setLoading] = useState(true)

    // Modal States
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)

    const [adjustmentData, setAdjustmentData] = useState({
        type: 'SYSTEM', // SYSTEM | BANK | GAME_ACCOUNT
        action: 'ADD', // ADD | SUBTRACT
        amount: '',         // Deprecated but kept for type safety if needed
        amount_money: '',
        amount_chip: '',
        chip_unit: 'B', // 'B' | 'M'
        note: '',
        target_id: '' // Optional: specific bank or game account ID
    })

    const [transferData, setTransferData] = useState({
        type: 'CHIP', // MONEY | CHIP
        source_id: '',
        target_id: '',
        amount: '',
        chip_unit: 'B', // 'B' | 'M'
        note: ''
    })

    const fetchStats = () => {
        setLoading(true)
        fetch('/api/internal/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                if (data.banks && Array.isArray(data.banks)) {
                    setData(data)
                } else {
                    console.error('Invalid stats data:', data)
                    // Keep default empty state but stop loading
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchStats()
    }, [])

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const requests = []

            // Money Request
            if (adjustmentData.amount_money) {
                const payload: any = {
                    type: 'MONEY',
                    action: adjustmentData.action,
                    amount: adjustmentData.amount_money,
                    note: adjustmentData.note
                }
                if (adjustmentData.type === 'BANK' && adjustmentData.target_id) {
                    payload.target_bank_id = adjustmentData.target_id
                }
                requests.push(fetch('/api/internal/adjustments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }))
            }

            // Chip Request
            if (adjustmentData.amount_chip) {
                // Convert to Billions if unit is M
                let finalAmount = parseFloat(adjustmentData.amount_chip)
                if (adjustmentData.chip_unit === 'M') {
                    finalAmount = finalAmount / 1000
                }

                const payload: any = {
                    type: 'CHIP',
                    action: adjustmentData.action,
                    amount: finalAmount.toString(),
                    note: adjustmentData.note
                }
                if (adjustmentData.type === 'GAME_ACCOUNT' && adjustmentData.target_id) {
                    payload.target_game_account_id = adjustmentData.target_id
                }
                requests.push(fetch('/api/internal/adjustments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }))
            }

            if (requests.length === 0) {
                alert('Mohon isi nominal (Money atau Chip)')
                return
            }

            const results = await Promise.all(requests)
            const allOk = results.every(r => r.ok)

            if (allOk) {
                setShowAdjustmentModal(false)
                setAdjustmentData({
                    type: 'SYSTEM',
                    action: 'ADD',
                    amount: '',
                    amount_money: '',
                    amount_chip: '',
                    chip_unit: 'B',
                    note: '',
                    target_id: ''
                })
                alert('Adjustment Berhasil')
                fetchStats()
            } else {
                alert('Sebagian atau semua adjustment gagal')
            }
        } catch (error) {
            console.error(error)
            alert('Gagal melakukan adjustment')
        }
    }

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            let finalAmount = parseFloat(transferData.amount)
            if (transferData.type === 'CHIP' && transferData.chip_unit === 'M') {
                finalAmount = finalAmount / 1000
            }

            const res = await fetch('/api/internal/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: transferData.type,
                    source_id: transferData.source_id,
                    target_id: transferData.target_id,
                    amount: finalAmount.toString(),
                    note: transferData.note
                })
            })
            const data = await res.json()
            if (res.ok) {
                setShowTransferModal(false)
                setTransferData({
                    type: 'CHIP',
                    source_id: '',
                    target_id: '',
                    amount: '',
                    chip_unit: 'B',
                    note: ''
                })
                alert('Transfer Berhasil')
                fetchStats()
            } else {
                alert(data.error || 'Transfer gagal')
            }
        } catch (error) {
            console.error(error)
            alert('Gagal melakukan transfer')
        }
    }

    // UI States
    const [showBankDetails, setShowBankDetails] = useState(false)
    const [showGameDetails, setShowGameDetails] = useState(false)

    // Calculate Totals
    const totalBankBalance = (data?.banks || []).reduce((acc: number, curr: any) => acc + (Number(curr.balance) || 0), 0)
    // Use server-side total if available (optimized), else fallback to client-side reduce
    const totalChipBalance = data?.totalStats?.chipBalance !== undefined
        ? Number(data.totalStats.chipBalance)
        : (data?.gameAccounts || []).reduce((acc: number, curr: any) => acc + (Number(curr.balance) || 0), 0)

    if (loading) return <div className="p-8 text-white">Loading dashboard...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
                        <p className="text-gray-400 text-sm mt-1">Overview statistik harian Clover Store.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAdjustmentModal(true)}
                            className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-all border border-emerald-500/20 hover:border-emerald-500/30 flex items-center gap-2"
                        >
                            + Adjustment
                        </button>
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-sm font-bold transition-all border border-indigo-500/20 hover:border-indigo-500/30 flex items-center gap-2"
                        >
                            ⇄ Transfer
                        </button>
                    </div>
                </div>

                {/* 1. High Level Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. High Level Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative group overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#111827] to-[#1f2937] border border-white/5 shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Uang (Bank)</p>
                                <p className="text-3xl font-black text-white tracking-tight">Rp {totalBankBalance.toLocaleString()}</p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/5 w-fit px-2 py-1 rounded-lg border border-emerald-500/10">
                                <Wallet size={14} />
                                <span>Aset Liquid</span>
                            </div>
                        </div>

                        <div className="relative group overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#111827] to-[#1f2937] border border-white/5 shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full blur-2xl" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Chip (Game)</p>
                                <p className="text-3xl font-black text-white tracking-tight">
                                    {totalChipBalance < 1
                                        ? `${(totalChipBalance * 1000).toLocaleString()} M`
                                        : `${totalChipBalance.toLocaleString()} B`
                                    }
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-blue-400 text-xs font-medium bg-blue-500/5 w-fit px-2 py-1 rounded-lg border border-blue-500/10">
                                <Coins size={14} />
                                <span>Aset Digital</span>
                            </div>
                        </div>

                        {data?.pendingCount > 0 ? (
                            <div className="relative group overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 shadow-xl animate-pulse">
                                <div className="absolute -right-4 -top-4">
                                    <div className="w-24 h-24 bg-yellow-500/20 rounded-full blur-xl" />
                                </div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2">Perlu Diproses</p>
                                        <p className="text-4xl font-black text-yellow-400 mb-1">{data.pendingCount}</p>
                                        <p className="text-xs text-yellow-500/80 font-medium">Transaksi Menunggu</p>
                                    </div>
                                    <a href="/admin/transactions" className="px-4 py-2 bg-yellow-500 text-black text-xs font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20">
                                        Proses Sekarang
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="relative group overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#111827] to-[#1f2937] border border-white/5 shadow-xl opacity-75">
                                <div className="flex items-center justify-between h-full">
                                    <div>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Status Antrian</p>
                                        <p className="text-2xl font-bold text-gray-300">Semua Aman</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        <Shield size={24} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 2. Detailed Lists (Collapsible) */}
                        <div className="glass rounded-xl p-5 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                            {/* Bank List */}
                            <div>
                                <button
                                    onClick={() => setShowBankDetails(!showBankDetails)}
                                    className="w-full flex items-center justify-between text-sm font-bold text-white mb-4 group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Wallet size={16} className="text-green-400" />
                                        <span>Rincian Bank</span>
                                    </div>
                                    <span className="text-xs text-gray-500 group-hover:text-white transition-colors">
                                        {showBankDetails ? 'Sembunyikan' : 'Tampilkan'}
                                    </span>
                                </button>

                                {showBankDetails && (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {(data?.banks || []).map((bank: any) => (
                                            <div key={bank.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white text-sm">{bank.name}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">{bank.account_number}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">{bank.account_name}</p>
                                                </div>
                                                <p className={`font-mono font-bold text-sm ${bank.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                    Rp {bank.balance.toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Game List */}
                            <div>
                                <button
                                    onClick={() => setShowGameDetails(!showGameDetails)}
                                    className="w-full flex items-center justify-between text-sm font-bold text-white mb-4 group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Coins size={16} className="text-blue-400" />
                                        <span>Rincian Chip</span>
                                    </div>
                                    <span className="text-xs text-gray-500 group-hover:text-white transition-colors">
                                        {showGameDetails ? 'Sembunyikan' : 'Tampilkan'}
                                    </span>
                                </button>

                                {showGameDetails && (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {(data?.gameAccounts || []).map((acc: any) => (
                                            <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white text-sm">{acc.game?.name}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">ID: {acc.id}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">{acc.username}</p>
                                                </div>
                                                <p className="font-mono font-bold text-sm text-blue-400">
                                                    {acc.balance < 1
                                                        ? `${(acc.balance * 1000).toLocaleString()} M`
                                                        : `${acc.balance.toLocaleString()} B`
                                                    }
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Daily Summary (Simplified) */}
                        <div className="glass rounded-xl p-5 h-fit">
                            <h3 className="text-sm font-bold text-white mb-4">Ringkasan Hari Ini</h3>

                            <div className="space-y-4">
                                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                            <ArrowDownLeft size={14} /> Top Up
                                        </span>
                                        <span className="text-xs text-gray-400">{data?.dailyStats?.topup?.count || 0} Form</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-gray-500">Uang Masuk</p>
                                            <p className="text-sm font-bold text-white">Rp {(data?.dailyStats?.topup?.money_in || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500">Chip Keluar</p>
                                            <p className="text-sm font-bold text-blue-400">
                                                {(data?.dailyStats?.topup?.chip_out || 0) < 1
                                                    ? `${((data?.dailyStats?.topup?.chip_out || 0) * 1000).toLocaleString()} M`
                                                    : `${(data?.dailyStats?.topup?.chip_out || 0).toLocaleString()} B`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                                            <ArrowUpRight size={14} /> Withdraw
                                        </span>
                                        <span className="text-xs text-gray-400">{data?.dailyStats?.withdraw?.count || 0} Form</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-gray-500">Uang Keluar</p>
                                            <p className="text-sm font-bold text-white">Rp {(data?.dailyStats?.withdraw?.money_out || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500">Chip Masuk</p>
                                            <p className="text-sm font-bold text-blue-400">
                                                {(data?.dailyStats?.withdraw?.chip_in || 0) < 1
                                                    ? `${((data?.dailyStats?.withdraw?.chip_in || 0) * 1000).toLocaleString()} M`
                                                    : `${(data?.dailyStats?.withdraw?.chip_in || 0).toLocaleString()} B`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modals */}
                    {showAdjustmentModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                                <h3 className="text-xl font-bold text-white mb-4">Adjustment Saldo</h3>
                                <form onSubmit={handleAdjustment} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Tipe Target</label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                value={adjustmentData.type}
                                                onChange={e => setAdjustmentData({ ...adjustmentData, type: e.target.value, target_id: '' })}
                                            >
                                                <option value="SYSTEM">System / Admin Balance</option>
                                                <option value="BANK">Rekening Bank (Money Only)</option>
                                                <option value="GAME_ACCOUNT">Akun Game (Chip Only)</option>
                                            </select>
                                        </div>

                                        {adjustmentData.type === 'BANK' && (
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Pilih Bank</label>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                    value={adjustmentData.target_id}
                                                    onChange={e => setAdjustmentData({ ...adjustmentData, target_id: e.target.value })}
                                                    required
                                                >
                                                    <option value="">-- Pilih Bank --</option>
                                                    {(data?.banks || []).map((b: any) => (
                                                        <option key={b.id} value={b.id}>{b.name} - {b.account_number}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {adjustmentData.type === 'GAME_ACCOUNT' && (
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Pilih Akun Game</label>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                    value={adjustmentData.target_id}
                                                    onChange={e => setAdjustmentData({ ...adjustmentData, target_id: e.target.value })}
                                                    required
                                                >
                                                    <option value="">-- Pilih Akun Game --</option>
                                                    {(data?.gameAccounts || []).map((g: any) => (
                                                        <option key={g.id} value={g.id}>{g.game?.name} - {g.username}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Aksi</label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                value={adjustmentData.action}
                                                onChange={e => setAdjustmentData({ ...adjustmentData, action: e.target.value })}
                                            >
                                                <option value="ADD">Tambah (+)</option>
                                                <option value="SUBTRACT">Kurang (-)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dual Inputs */}
                                    <div className={adjustmentData.type === 'GAME_ACCOUNT' ? 'opacity-50 pointer-events-none' : ''}>
                                        <label className="text-sm text-gray-400 mb-1 block">Nominal Uang</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white"
                                                value={adjustmentData.amount_money}
                                                onChange={e => setAdjustmentData({ ...adjustmentData, amount_money: e.target.value })}
                                                disabled={adjustmentData.type === 'GAME_ACCOUNT'}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                        </div>
                                    </div>

                                    <div className={adjustmentData.type === 'BANK' ? 'opacity-50 pointer-events-none' : ''}>
                                        <label className="text-sm text-gray-400 mb-1 block">Nominal Chip</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                value={adjustmentData.amount_chip}
                                                onChange={e => setAdjustmentData({ ...adjustmentData, amount_chip: e.target.value })}
                                                disabled={adjustmentData.type === 'BANK'}
                                            />
                                            <select
                                                className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-yellow-500 font-bold"
                                                value={adjustmentData.chip_unit}
                                                onChange={e => setAdjustmentData({ ...adjustmentData, chip_unit: e.target.value as 'B' | 'M' })}
                                                disabled={adjustmentData.type === 'BANK'}
                                            >
                                                <option value="B">B</option>
                                                <option value="M">M</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Catatan</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                            value={adjustmentData.note}
                                            onChange={e => setAdjustmentData({ ...adjustmentData, note: e.target.value })}
                                            placeholder="Keterangan..."
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setShowAdjustmentModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10">Batal</button>
                                        <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600">Proses</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Transfer Modal */}
                    {showTransferModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                                <h3 className="text-xl font-bold text-white mb-4">Transfer Aset</h3>
                                <form onSubmit={handleTransfer} className="space-y-4">
                                    <div className="flex gap-4 mb-2">
                                        <label className={`flex-1 p-3 rounded-xl border cursor-pointer text-center font-bold transition-all ${transferData.type === 'MONEY' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                                            <input type="radio" name="type" value="MONEY" checked={transferData.type === 'MONEY'} onChange={() => setTransferData({ ...transferData, type: 'MONEY', source_id: '', target_id: '' })} className="hidden" />
                                            Uang
                                        </label>
                                        <label className={`flex-1 p-3 rounded-xl border cursor-pointer text-center font-bold transition-all ${transferData.type === 'CHIP' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                                            <input type="radio" name="type" value="CHIP" checked={transferData.type === 'CHIP'} onChange={() => setTransferData({ ...transferData, type: 'CHIP', source_id: '', target_id: '' })} className="hidden" />
                                            Chip
                                        </label>
                                    </div>

                                    {transferData.type === 'CHIP' ? (
                                        <>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Dari Akun</label>
                                                <select
                                                    required
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                    value={transferData.source_id}
                                                    onChange={e => setTransferData({ ...transferData, source_id: e.target.value })}
                                                >
                                                    <option value="">Pilih Akun Asal</option>
                                                    {(data?.gameAccounts || []).map((g: any) => (
                                                        <option key={g.id} value={g.id}>{g.game?.name} - {g.username} ({g.balance} B)</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Ke Akun</label>
                                                <select
                                                    required
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                    value={transferData.target_id}
                                                    onChange={e => setTransferData({ ...transferData, target_id: e.target.value })}
                                                >
                                                    <option value="">Pilih Akun Tujuan</option>
                                                    {(data?.gameAccounts || []).map((g: any) => (
                                                        <option key={g.id} value={g.id}>{g.game?.name} - {g.username} ({g.balance} B)</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Dari Bank</label>
                                                <select
                                                    required
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                    value={transferData.source_id}
                                                    onChange={e => setTransferData({ ...transferData, source_id: e.target.value })}
                                                >
                                                    <option value="">Pilih Bank Asal</option>
                                                    {(data?.banks || []).map((b: any) => (
                                                        <option key={b.id} value={b.id}>{b.name} - {b.account_name} (Rp {b.balance.toLocaleString()})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Ke Bank</label>
                                                <select
                                                    required
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                    value={transferData.target_id}
                                                    onChange={e => setTransferData({ ...transferData, target_id: e.target.value })}
                                                >
                                                    <option value="">Pilih Bank Tujuan</option>
                                                    {(data?.banks || []).map((b: any) => (
                                                        <option key={b.id} value={b.id}>{b.name} - {b.account_name} (Rp {b.balance.toLocaleString()})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Nominal {transferData.type === 'MONEY' ? 'Uang' : 'Chip'}</label>
                                        {transferData.type === 'MONEY' ? (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white"
                                                    value={transferData.amount}
                                                    onChange={e => setTransferData({ ...transferData, amount: e.target.value })}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    required
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                    value={transferData.amount}
                                                    onChange={e => setTransferData({ ...transferData, amount: e.target.value })}
                                                />
                                                <select
                                                    className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-yellow-500 font-bold"
                                                    value={transferData.chip_unit}
                                                    onChange={e => setTransferData({ ...transferData, chip_unit: e.target.value as 'B' | 'M' })}
                                                >
                                                    <option value="B">B</option>
                                                    <option value="M">M</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Catatan</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                            value={transferData.note}
                                            onChange={e => setTransferData({ ...transferData, note: e.target.value })}
                                            placeholder="Keterangan..."
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10">Batal</button>
                                        <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600">Proses Transfer</button>
                                    </div>
                                </form>
                            </div >
                        </div >
                    )
                    }
                </div >
                )
}


