'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, ChevronLeft, ChevronRight, Users, Wallet, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Transaction {
    id: number
    user_wa: string
    nickname: string
    amount_money: number
    type: string
    status: string
    createdAt: string | Date
    target_payment_details?: string | null
    user?: {
        username: string
        level: string
        bank_name?: string | null
        account_number?: string | null
        account_name?: string | null
    } | null
}

export default function ReferralWithdrawalsClient({
    initialTransactions,
    initialPagination,
    banks
}: {
    initialTransactions: Transaction[]
    initialPagination: { totalPages: number, page: number }
    banks: any[]
}) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
    const [totalPages, setTotalPages] = useState(initialPagination.totalPages)
    const [page, setPage] = useState(initialPagination.page)
    const [loading, setLoading] = useState(false)
    const [selectedBankId, setSelectedBankId] = useState<number | ''>('')
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [currentAdminId, setCurrentAdminId] = useState<number>(1)

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) setCurrentAdminId(Number(user.id))
            }
        } catch (e) { }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('page', page.toString())
            params.append('type', 'REFERRAL_WD')
            const res = await fetch(`/api/transactions?${params.toString()}`)
            const data = await res.json()
            if (data && data.data) {
                setTransactions(data.data)
                setTotalPages(data.pagination.totalPages)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [page])

    const handleApproval = async (id: number, stage: number, action: 'APPROVE' | 'DECLINE') => {
        if (processingId) return
        if (action === 'APPROVE' && stage === 2 && !selectedBankId) {
            alert('Pilih Bank pengirim uang!')
            return
        }

        setProcessingId(id)
        try {
            const res = await fetch(`/api/transactions/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': String(currentAdminId)
                },
                body: JSON.stringify({
                    stage,
                    action,
                    admin_id: currentAdminId,
                    bank_id: selectedBankId ? Number(selectedBankId) : undefined
                })
            })

            if (res.ok) {
                fetchData()
                setSelectedBankId('')
            } else {
                const data = await res.json()
                alert(`Gagal: ${data.error}`)
            }
        } catch (e) {
            alert('Kesalahan koneksi')
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Penarikan Bonus Referral</h1>
                    <p className="text-gray-400 text-sm">Kelola permintaan pencairan saldo bonus dari member.</p>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-violet-500/20 rounded-xl text-violet-400">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Total Saldo Bonus</p>
                        <p className="text-lg font-black text-white leading-none">REFERRAL MGMT</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Member</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Detail Bank Tujuan</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Jumlah Penarikan</th>
                                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500 font-bold animate-pulse">Memuat Transaksi...</td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500 font-bold">Tidak ada penarikan bonus saat ini.</td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5 transition-all">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white shadow-lg">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-white uppercase tracking-wide">{tx.nickname}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">#{tx.id} • {new Date(tx.createdAt).toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3 text-cyan-400 bg-cyan-400/5 px-3 py-2 rounded-xl border border-cyan-400/10">
                                                <CreditCard size={16} />
                                                <span className="text-xs font-bold font-mono tracking-wider">{tx.target_payment_details}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-emerald-400 font-mono text-lg font-black italic">Rp {tx.amount_money.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    tx.status === 'APPROVED_1' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        tx.status === 'APPROVED_2' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                {tx.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {tx.status === 'APPROVED_2' || tx.status === 'DECLINED' ? (
                                                <div className="text-xs text-gray-500 font-bold uppercase">Sudah Diproses</div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    {tx.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproval(tx.id, 1, 'APPROVE')}
                                                                className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                                            >
                                                                Terima
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproval(tx.id, 1, 'DECLINE')}
                                                                className="px-4 py-2 rounded-xl bg-white/5 text-rose-500 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </>
                                                    )}
                                                    {tx.status === 'APPROVED_1' && (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                                                                value={selectedBankId}
                                                                onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : '')}
                                                            >
                                                                <option value="">Pilih Bank Pengirim...</option>
                                                                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                            </select>
                                                            <button
                                                                onClick={() => handleApproval(tx.id, 2, 'APPROVE')}
                                                                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                                            >
                                                                Transfer
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproval(tx.id, 2, 'DECLINE')}
                                                                className="px-4 py-2 rounded-xl bg-white/5 text-rose-500 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                                            >
                                                                Batal
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                        <p className="text-sm text-gray-500 font-bold">Halaman {page} dari {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-2 rounded-xl bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 rounded-xl bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
