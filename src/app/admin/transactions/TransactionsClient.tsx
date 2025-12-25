'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Transaction {
    id: number
    user_wa: string
    nickname: string
    user_game_id?: string
    amount_chip: number
    amount_money: number
    type: string
    status: string
    proof_image: string | null
    game: { name: string }
    paymentMethod: { name: string } | null
    withdrawMethod: { name: string } | null
    createdAt: string | Date
    target_payment_details?: string | null
}

interface TransactionsClientProps {
    initialTransactions: Transaction[]
    initialPagination: { totalPages: number, page: number }
    gameAccounts: any[]
    banks: any[]
}

export default function TransactionsClient({
    initialTransactions,
    initialPagination,
    gameAccounts,
    banks
}: TransactionsClientProps) {
    const router = useRouter()
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
    const [loading, setLoading] = useState(false)
    const [currentAdminId, setCurrentAdminId] = useState<number>(1)

    // Filters
    const [filterDate, setFilterDate] = useState('')
    const [filterBank, setFilterBank] = useState('all')
    const [filterType, setFilterType] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(initialPagination.page)
    const [totalPages, setTotalPages] = useState(initialPagination.totalPages)

    // Selection
    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('')
    const [selectedBankId, setSelectedBankId] = useState<number | ''>('')
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    // Edit State
    const [editingDetail, setEditingDetail] = useState<{ id: number, field: 'TARGET' | 'GAME_ID', value: string } | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) setCurrentAdminId(Number(user.id))
            }
        } catch (e) {
            console.error('Failed to load user session', e)
        }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('page', page.toString())
            params.append('limit', '20')
            if (filterDate) params.append('date', filterDate)
            if (filterBank !== 'all') params.append('bank_id', filterBank)
            if (filterType !== 'all') params.append('type', filterType)
            if (searchQuery) params.append('search', searchQuery)

            const res = await fetch(`/api/transactions?${params.toString()}`)
            const data = await res.json()

            if (data && data.data) {
                setTransactions(data.data)
                setTotalPages(Number(data.pagination.totalPages) || 1)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [filterDate, filterBank, filterType, page, searchQuery])

    // Fetch on filter change
    useEffect(() => {
        // Skip first render as data is passed initially
        if (page === initialPagination.page && !searchQuery && !filterDate && filterBank === 'all' && filterType === 'all') return
        fetchData()
    }, [page, filterDate, filterBank, filterType, searchQuery])

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

    const handleStartEdit = (id: number, field: 'TARGET' | 'GAME_ID', currentValue: string) => {
        setEditingDetail({ id, field, value: currentValue || '' })
    }

    const handleSaveEdit = async () => {
        if (!editingDetail) return
        setSaving(true)
        try {
            const body: any = { admin_id: currentAdminId }
            if (editingDetail.field === 'TARGET') body.target_payment_details = editingDetail.value
            if (editingDetail.field === 'GAME_ID') body.user_game_id = editingDetail.value

            const res = await fetch(`/api/transactions/${editingDetail.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            })
            if (res.ok) {
                fetchData() // Refresh data
                setEditingDetail(null)
            } else {
                alert('Gagal update data')
            }
        } catch (e) {
            console.error(e)
            alert('Error updating')
        } finally {
            setSaving(false)
        }
    }

    const handleApproval = async (id: number, stage: number, action: 'APPROVE' | 'DECLINE', type: 'TOPUP' | 'WITHDRAW') => {
        if (action === 'APPROVE') {
            if (type === 'TOPUP' && stage === 2 && !selectedAccountId) {
                alert('Pilih Akun Game (Panel ID) pengirim chip!')
                return
            }
            if (type === 'WITHDRAW' && stage === 1 && !selectedAccountId) {
                alert('Pilih Akun Game (Panel ID) penerima chip!')
                return
            }
            if (type === 'WITHDRAW' && stage === 2 && !selectedBankId) {
                alert('Pilih Bank (Panel Bank) pengirim uang!')
                return
            }
        }

        try {
            const res = await fetch(`/api/transactions/${id}/approve`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    stage,
                    action,
                    admin_id: currentAdminId,
                    game_account_id: selectedAccountId ? Number(selectedAccountId) : undefined,
                    bank_id: selectedBankId ? Number(selectedBankId) : undefined
                })
            })
            if (res.ok) {
                fetchData()
                setSelectedAccountId('')
                setSelectedBankId('')
            } else {
                alert('Gagal memproses transaksi')
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Manajemen Transaksi</h1>
                    <p className="text-gray-400 mt-1">Kelola Top Up dan Withdraw (Showing Page {page} of {totalPages})</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Cari ID/Nickname/WA..."
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-cyan-500 min-w-[200px]"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                    <input
                        type="date"
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                        value={filterDate}
                        onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                    />
                    <select
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                        value={filterBank}
                        onChange={(e) => { setFilterBank(e.target.value); setPage(1); }}
                    >
                        <option value="all">Semua Bank</option>
                        {banks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <select
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                    >
                        <option value="all">Semua Tipe</option>
                        <option value="TOPUP">Top Up</option>
                        <option value="WITHDRAW">Withdraw</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {loading && (
                    <div className="text-center py-4 text-emerald-400 animate-pulse">
                        Refreshing data...
                    </div>
                )}

                {transactions.map((tx) => (
                    <div key={tx.id} className="glass p-0 rounded-3xl overflow-hidden hover:bg-white/5 transition-all duration-300 border border-white/5 group">
                        <div className="p-6 flex flex-col md:flex-row gap-8">
                            {/* Left: Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${tx.type === 'TOPUP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        {tx.type}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                        <Clock size={12} />
                                        {new Date(tx.createdAt).toLocaleString()}
                                    </div>
                                    <span className="text-gray-600 text-xs font-mono">#{tx.id}</span>
                                </div>

                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">{tx.nickname}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-cyan-400 text-sm font-medium">{tx.game?.name || 'Unknown Game'}</p>

                                            {/* Editable User Game ID */}
                                            {editingDetail?.id === tx.id && editingDetail.field === 'GAME_ID' ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        className="bg-black/50 border border-white/20 rounded px-2 py-1 text-xs text-white w-24"
                                                        value={editingDetail.value}
                                                        onChange={e => setEditingDetail({ ...editingDetail, value: e.target.value })}
                                                    />
                                                    <button onClick={handleSaveEdit} disabled={saving} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                                                    <button onClick={() => setEditingDetail(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 group/edit">
                                                    {/* @ts-ignore */}
                                                    {tx.user_game_id && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
                                                            ID: {tx.user_game_id}
                                                        </span>
                                                    )}
                                                    {tx.status === 'PENDING' && (
                                                        <button
                                                            /* @ts-ignore */
                                                            onClick={() => handleStartEdit(tx.id, 'GAME_ID', tx.user_game_id)}
                                                            className="opacity-0 group-hover/edit:opacity-100 text-gray-500 hover:text-white transition-opacity"
                                                        >
                                                            <Pencil size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                                        <p className="text-white font-mono text-sm">{tx.user_wa}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-4 bg-black/20 rounded-2xl border border-white/5">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Nominal Chip</p>
                                        <p className="font-bold text-yellow-400 text-lg">
                                            {tx.amount_chip < 1
                                                ? `${(tx.amount_chip * 1000).toLocaleString()} M`
                                                : `${tx.amount_chip.toLocaleString()} B`
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Nominal Uang</p>
                                        <p className="font-bold text-white text-lg">Rp {tx.amount_money.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{tx.type === 'TOPUP' ? 'Bank Tujuan' : 'Metode'}</p>
                                        <p className="text-cyan-400 font-bold text-lg">
                                            {tx.type === 'TOPUP' ? (tx.paymentMethod?.name || 'Unknown') : (tx.withdrawMethod?.name || 'Unknown')}
                                        </p>
                                    </div>

                                    {/* Editable Target Payment Details (WD) */}
                                    {tx.type === 'WITHDRAW' && (
                                        <div className="col-span-2 md:col-span-3 pt-2 border-t border-white/5 mt-2">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rekening Tujuan User</p>

                                            {editingDetail?.id === tx.id && editingDetail.field === 'TARGET' ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white w-full font-mono"
                                                        value={editingDetail.value}
                                                        onChange={e => setEditingDetail({ ...editingDetail, value: e.target.value })}
                                                        placeholder="Contoh: DANA 081234..."
                                                    />
                                                    <button onClick={handleSaveEdit} disabled={saving} className="bg-green-500/20 p-2 rounded-lg text-green-400 hover:bg-green-500/30"><Check size={16} /></button>
                                                    <button onClick={() => setEditingDetail(null)} className="bg-red-500/20 p-2 rounded-lg text-red-400 hover:bg-red-500/30"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 group/edit-target">
                                                    <p className="text-white text-sm font-mono bg-white/5 p-2 rounded-lg inline-block">
                                                        {tx.target_payment_details || '-'}
                                                    </p>
                                                    {tx.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleStartEdit(tx.id, 'TARGET', tx.target_payment_details || '')}
                                                            className="opacity-0 group-hover/edit-target:opacity-100 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                                        >
                                                            <Pencil size={14} /> Edit
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Middle: Proof & Status */}
                            <div className="flex flex-col items-center justify-center gap-4 min-w-[180px] border-l border-white/5 pl-8 border-dashed">
                                {tx.proof_image ? (
                                    <div
                                        className="relative group/img cursor-pointer"
                                        onClick={() => setPreviewImage(tx.proof_image)}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={tx.proof_image} alt="Bukti" className="w-24 h-24 object-cover rounded-2xl border border-white/10 shadow-2xl" />
                                        <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-bold">
                                            Lihat Foto
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center text-[10px] text-gray-600 border border-white/5 border-dashed">No Image</div>
                                )}

                                <div className="text-center w-full">
                                    <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                        tx.status.includes('APPROVED') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {tx.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex flex-col justify-center gap-3 min-w-[250px] bg-white/5 p-4 rounded-2xl">
                                {tx.status === 'DECLINED' || tx.status === 'APPROVED_2' ? (
                                    <div className="h-full flex items-center justify-center text-gray-600 font-medium text-sm italic">
                                        Transaksi Selesai
                                    </div>
                                ) : (
                                    <div className="space-y-3 w-full">
                                        {/* TOP UP FLOW */}
                                        {tx.type === 'TOPUP' && (
                                            <>
                                                {tx.status === 'PENDING' && (
                                                    <>
                                                        <div className="text-xs text-gray-400 text-center mb-2 font-medium">Tahap 1: Verifikasi Pembayaran</div>
                                                        <button onClick={() => handleApproval(tx.id, 1, 'APPROVE', 'TOPUP')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-1">
                                                            <Check size={18} /> Terima Uang
                                                        </button>
                                                        <button onClick={() => handleApproval(tx.id, 1, 'DECLINE', 'TOPUP')} className="w-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all">
                                                            <X size={18} /> Tolak
                                                        </button>
                                                    </>
                                                )}
                                                {tx.status === 'APPROVED_1' && (
                                                    <>
                                                        <div className="text-xs text-blue-400 text-center mb-2 font-medium">Tahap 2: Kirim Chip ke User</div>

                                                        <div className="bg-black/40 p-3 rounded-xl border border-white/10 mb-2">
                                                            <label className="text-[10px] text-gray-400 block mb-1">Pilih Akun Pengirim (Panel ID)</label>
                                                            <select
                                                                className="w-full bg-transparent text-white text-sm outline-none"
                                                                value={selectedAccountId}
                                                                onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : '')}
                                                            >
                                                                <option value="" className="bg-gray-900">Pilih ID...</option>
                                                                {gameAccounts.map(acc => (
                                                                    <option key={acc.id} value={acc.id} className="bg-gray-900">
                                                                        {acc.username} ({acc.game.name}) - Stok: {acc.balance}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <button onClick={() => handleApproval(tx.id, 2, 'APPROVE', 'TOPUP')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1">
                                                            <Check size={18} /> Chip Terkirim
                                                        </button>
                                                        <button onClick={() => handleApproval(tx.id, 2, 'DECLINE', 'TOPUP')} className="w-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all">
                                                            <X size={18} /> Batalkan
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {/* WITHDRAW FLOW */}
                                        {tx.type === 'WITHDRAW' && (
                                            <>
                                                {tx.status === 'PENDING' && (
                                                    <>
                                                        <div className="text-xs text-gray-400 text-center mb-2 font-medium">Tahap 1: Cek Chip Masuk</div>

                                                        <div className="bg-black/40 p-3 rounded-xl border border-white/10 mb-2">
                                                            <label className="text-[10px] text-gray-400 block mb-1">Pilih Akun Penerima (Panel ID)</label>
                                                            <select
                                                                className="w-full bg-transparent text-white text-sm outline-none"
                                                                value={selectedAccountId}
                                                                onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : '')}
                                                            >
                                                                <option value="" className="bg-gray-900">Pilih ID...</option>
                                                                {gameAccounts.map(acc => (
                                                                    <option key={acc.id} value={acc.id} className="bg-gray-900">
                                                                        {acc.username} ({acc.game.name}) - Stok: {acc.balance}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <button onClick={() => handleApproval(tx.id, 1, 'APPROVE', 'WITHDRAW')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-1">
                                                            <Check size={18} /> Chip Diterima
                                                        </button>
                                                        <button onClick={() => handleApproval(tx.id, 1, 'DECLINE', 'WITHDRAW')} className="w-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all">
                                                            <X size={18} /> Tolak
                                                        </button>
                                                    </>
                                                )}
                                                {tx.status === 'APPROVED_1' && (
                                                    <>
                                                        <div className="text-xs text-blue-400 text-center mb-2 font-medium">Tahap 2: Transfer Uang ke User</div>

                                                        <div className="bg-black/40 p-3 rounded-xl border border-white/10 mb-2">
                                                            <label className="text-[10px] text-gray-400 block mb-1">Pilih Bank Pengirim (Panel Bank)</label>
                                                            <select
                                                                className="w-full bg-transparent text-white text-sm outline-none"
                                                                value={selectedBankId}
                                                                onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : '')}
                                                            >
                                                                <option value="" className="bg-gray-900">Pilih Bank...</option>
                                                                {banks.map(bank => (
                                                                    <option key={bank.id} value={bank.id} className="bg-gray-900">
                                                                        {bank.name} ({bank.number}) - Saldo: {bank.balance.toLocaleString()}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <button onClick={() => handleApproval(tx.id, 2, 'APPROVE', 'WITHDRAW')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1">
                                                            <Check size={18} /> Uang Ditransfer
                                                        </button>
                                                        <button onClick={() => handleApproval(tx.id, 2, 'DECLINE', 'WITHDRAW')} className="w-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all">
                                                            <X size={18} /> Batalkan
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {transactions.length === 0 && (
                    <div className="text-center text-gray-500 py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                        <p>{searchQuery ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi saat ini.'}</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="text-white font-mono text-sm px-4">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewImage}
                            alt="Bukti Full"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        />
                        <button
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
