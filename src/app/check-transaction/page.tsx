'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
// Removed Navbar import as it's global now

interface Transaction {
    id: number
    trx_id: string | null
    status: string
    amount_chip: number
    amount_money: number
    nickname: string
    game: { name: string }
    paymentMethod: { name: string }
    createdAt: string
}

import Link from 'next/link'

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
            const res = await fetch(`/api/transactions?search=${encodeURIComponent(search)}&limit=50`)
            const data = await res.json()

            if (data && Array.isArray(data.data)) {
                const transactions = data.data
                if (transactions.length > 0) {
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
            case 'APPROVED_2': return 'text-cyan-400'
            case 'DECLINED': return 'text-red-500'
            default: return 'text-purple-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED_2': return <CheckCircle className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            case 'DECLINED': return <XCircle className="w-16 h-16 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            default: return <Clock className="w-16 h-16 text-purple-400 animate-pulse drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'APPROVED_2': return 'Misi Berhasil'
            case 'DECLINED': return 'Misi Gagal'
            default: return 'Sedang Diproses'
        }
    }

    return (
        <div className="pt-24 pb-20 px-4">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="v4-font-syne text-4xl font-extrabold text-white mb-4 uppercase tracking-tight">
                        Cek <span className="v4-text-gradient">Transaksi</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">Masukkan Nomor WhatsApp atau ID Transaksi Anda</p>
                </div>

                <div className="v4-glass p-8 rounded-[32px] mb-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <form onSubmit={handleSearch} className="relative z-10">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Contoh: 081234567890"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all pr-16 v4-font-mono font-medium"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 bottom-2 aspect-square v4-btn-main rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 mb-8">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {result && (
                    <div className="v4-glass rounded-[32px] p-8 animate-in fade-in slide-in-from-bottom-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl"></div>
                        
                        <div className="flex flex-col items-center text-center mb-10 relative z-10">
                            <div className="mb-6 p-5 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                                {getStatusIcon(result.status)}
                            </div>
                            <h2 className={`v4-font-syne text-3xl font-black uppercase tracking-tight ${getStatusColor(result.status)}`}>
                                {getStatusText(result.status)}
                            </h2>
                            <div className="mt-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                                TRX ID: {result.trx_id || `#${result.id}`}
                            </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                            {[
                                { label: 'Game', val: result.game?.name },
                                { label: 'Nickname', val: result.nickname },
                                { label: 'Nominal', val: result.amount_chip >= 1 
                                    ? `${(Math.floor(result.amount_chip * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B` 
                                    : `${(result.amount_chip * 1000).toLocaleString()} M` },
                                { label: 'Total Bayar', val: `Rp ${result.amount_money.toLocaleString()}` },
                                { label: 'Pembayaran', val: result.paymentMethod?.name },
                                { label: 'Waktu', val: new Date(result.createdAt).toLocaleString(), small: true }
                            ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 group/item">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{item.label}</span>
                                    <span className={`text-white font-bold ${item.small ? 'text-sm' : 'text-base'}`}>{item.val}</span>
                                </div>
                            ))}
                        </div>

                        {result.status === 'DECLINED' && (
                            <div className="mt-10 relative z-10">
                                <Link
                                    href="/"
                                    className="block w-full text-center py-5 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl font-black text-white hover:shadow-2xl hover:shadow-red-500/20 transition-all transform hover:-translate-y-1 text-sm tracking-widest"
                                >
                                    AJUKAN ULANG SEKARANG
                                </Link>
                                <p className="text-center text-[10px] text-gray-500 mt-4 font-bold uppercase tracking-tighter">
                                    Silakan perbaiki data atau upload bukti yang valid.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
