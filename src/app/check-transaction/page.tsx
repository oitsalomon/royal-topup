'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'

interface Transaction {
    id: number
    status: string
    amount_chip: number
    amount_money: number
    nickname: string
    game: { name: string }
    paymentMethod: { name: string }
    createdAt: string
}

export default function CheckTransaction() {
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<Transaction | null>(null)
    const [error, setError] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setResult(null)

        try {
            // Search via API (Server-side filtering)
            // Supports searching by WA Number, Game ID, or Nickname
            const res = await fetch(`/api/transactions?search=${encodeURIComponent(search)}&limit=50`)
            const data = await res.json()

            if (data && Array.isArray(data.data)) {
                // The API returns fuzzy matches. We want to be a bit precise if it's a number
                // But for user convenience, showing the latest match is usually best.
                // Let's take the first result that matches loosely.

                const transactions = data.data
                if (transactions.length > 0) {
                    // If multiple found, prioritize exact match or the latest one (API sorts by desc)
                    setResult(transactions[0])
                } else {
                    setError('Transaksi tidak ditemukan.')
                }
            } else {
                setError('Format data tidak valid.')
            }
        } catch (err) {
            console.error(err)
            setError('Terjadi kesalahan saat mencari data.')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED_2': return 'text-green-400'
            case 'DECLINED': return 'text-red-400'
            default: return 'text-yellow-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED_2': return <CheckCircle className="w-16 h-16 text-green-500" />
            case 'DECLINED': return <XCircle className="w-16 h-16 text-red-500" />
            default: return <Clock className="w-16 h-16 text-yellow-500" />
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'APPROVED_2': return 'Transaksi Berhasil'
            case 'DECLINED': return 'Transaksi Dibatalkan'
            default: return 'Sedang Diproses'
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Navbar />

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-white mb-4">Cek Transaksi</h1>
                        <p className="text-gray-400">Masukkan Nomor WhatsApp atau ID Transaksi Anda</p>
                    </div>

                    <div className="glass p-8 rounded-3xl mb-8">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Contoh: 081234567890"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all pr-14"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle />
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="glass rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="mb-4 p-4 bg-white/5 rounded-full">
                                    {getStatusIcon(result.status)}
                                </div>
                                <h2 className={`text-2xl font-bold ${getStatusColor(result.status)}`}>
                                    {getStatusText(result.status)}
                                </h2>
                                <p className="text-gray-400 mt-1">ID: #{result.id}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-400">Game</span>
                                    <span className="text-white font-bold">{result.game?.name}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-400">Nickname</span>
                                    <span className="text-white font-bold">{result.nickname}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-400">Nominal</span>
                                    <span className="text-white font-bold">
                                        {result.amount_chip >= 1
                                            ? `${(Math.floor(result.amount_chip * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`
                                            : `${(result.amount_chip * 1000).toLocaleString()} M`}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-400">Total Bayar</span>
                                    <span className="text-white font-bold">Rp {result.amount_money.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-400">Pembayaran</span>
                                    <span className="text-white font-bold">{result.paymentMethod?.name}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-400">Waktu</span>
                                    <span className="text-white font-bold text-sm">
                                        {new Date(result.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
