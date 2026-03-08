'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Pencil, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
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
    user?: {
        username: string
        level: string
        bank_name?: string | null
        account_number?: string | null
        account_name?: string | null
        gameIds?: {
            game_user_id: string
            nickname: string | null
            game_id: number
        }[]
    } | null
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
    const [totalPages, setTotalPages] = useState(initialPagination.totalPages)
    const [localGameAccounts, setLocalGameAccounts] = useState<any[]>(gameAccounts)
    const [localBanks, setLocalBanks] = useState<any[]>(banks)
    const [loading, setLoading] = useState(false)

    // RESTORED STATE
    const [currentAdminId, setCurrentAdminId] = useState<number>(1)
    const [filterDate, setFilterDate] = useState('')
    const [filterBank, setFilterBank] = useState('all')
    const [filterType, setFilterType] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [localSearchQuery, setLocalSearchQuery] = useState('') // OPTIMIZATION: local search state for smooth typing
    const [page, setPage] = useState(initialPagination.page)

    // Selection
    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('')
    const [selectedBankId, setSelectedBankId] = useState<number | ''>('')
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    // Edit State
    const [editingDetail, setEditingDetail] = useState<{ id: number, field: 'TARGET' | 'GAME_ID', value: string } | null>(null)
    const [saving, setSaving] = useState(false)

    // Initial Data Fetch - REDUNDANT (Handled by SSR)
    // useEffect(() => { ... }, [])

    /*
     * We no longer need to fetch initial data or helper data on mount.
     * It is passed directly from the server component.
     * We just need to load the user session.
     */
    useEffect(() => {
        // Load User Session
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) setCurrentAdminId(Number(user.id))
            }
        } catch (e) { }
    }, [])

    // Ensure loading is false initially since we have data
    // const [loading, setLoading] = useState(true) -> false


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

    // Auto-refresh every 2s (Silent) for faster updates as requested by user
    useEffect(() => {
        const interval = setInterval(() => {
            const fetchSilent = async () => {
                try {
                    const params = new URLSearchParams()
                    params.append('page', page.toString())
                    params.append('limit', '20')
                    // ... params
                    if (filterDate) params.append('date', filterDate)
                    if (filterBank !== 'all') params.append('bank_id', filterBank)
                    if (filterType !== 'all') params.append('type', filterType)
                    if (searchQuery) params.append('search', searchQuery)

                    const res = await fetch(`/api/transactions?${params.toString()}`)
                    const data = await res.json()

                    if (data && data.data) {
                        // OPTIMIZATION: Only update state if data actually changed to prevent heavy DOM re-renders every interval
                        setTransactions(prev => {
                            if (JSON.stringify(prev) === JSON.stringify(data.data)) return prev;
                            return data.data;
                        })
                    }
                } catch (e) { console.error('Silent refresh failed', e) }
            }
            fetchSilent()
        }, 3500) // OPTIMIZATION: Changed to 3.5s to reduce network and browser processing load while remaining live
        return () => clearInterval(interval)
    }, [filterDate, filterBank, filterType, page, searchQuery])

    // Fetch on filter change
    useEffect(() => {
        // Only fetch if it's not the initial mount conditions (SSR handles that)
        if (page === 1 && !searchQuery && !filterDate && filterBank === 'all' && filterType === 'all') return
        fetchData()
    }, [page, filterDate, filterBank, filterType, searchQuery])

    // OPTIMIZATION: Debounce Search Effect Separately
    // This allows typing to be extremely smooth without triggering 20-item map re-renders on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(localSearchQuery)
            if (localSearchQuery !== searchQuery) setPage(1)
        }, 500) // 500ms delay

        return () => clearTimeout(timer)
    }, [localSearchQuery])

    // RESTORED HELPER FUNCTIONS
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

    const [processingId, setProcessingId] = useState<number | null>(null)

    const handleApproval = async (id: number, stage: number, action: 'APPROVE' | 'DECLINE', type: 'TOPUP' | 'WITHDRAW') => {
        if (processingId) return // Prevent double actions

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

        setProcessingId(id)

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

            if (res.status === 409) {
                const data = await res.json()
                alert(`⚠️ KONFLIK: ${data.error}`)
                fetchData() // Immediate refresh
                return
            }

            if (res.ok) {
                await fetchData()
                setSelectedAccountId('')
                setSelectedBankId('')
            } else {
                const data = await res.json()
                alert(`Gagal: ${data.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error(error)
            alert('Kesalahan koneksi')
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Manajemen Transaksi</h1>
                        <button 
                            onClick={fetchData} 
                            disabled={loading}
                            className={`p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh Data"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <p className="text-gray-400 mt-1">Kelola Top Up dan Withdraw (Showing Page {page} of {totalPages})</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Cari ID/Nickname/WA..."
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-cyan-500 min-w-[200px]"
                        value={localSearchQuery}
                        onChange={(e) => setLocalSearchQuery(e.target.value)}
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
                        {localBanks.map(b => (
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
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white/5 h-20 rounded-xl border border-white/5"></div>
                        ))}
                    </div>
                )}

                {!loading && transactions.map((tx) => {
                    // HELPER: Stronger Visual Styles for Levels
                    const getLevelData = (level?: string) => {
                        switch (level) {
                            case 'DIAMOND':
                                return {
                                    cardClass: 'bg-[#050505] border-cyan-500/30 hover:border-cyan-500/60 shadow-[inset_2px_0_0_0_rgba(34,211,238,1)]',
                                    badgeClass: 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20',
                                    textClass: 'text-cyan-300'
                                }
                            case 'PLATINUM':
                                return {
                                    cardClass: 'bg-[#050505] border-fuchsia-500/30 hover:border-fuchsia-500/60 shadow-[inset_2px_0_0_0_rgba(217,70,239,1)]',
                                    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-400 font-bold border border-fuchsia-500/20',
                                    textClass: 'text-fuchsia-400'
                                }
                            case 'GOLD':
                                return {
                                    cardClass: 'bg-[#050505] border-amber-500/30 hover:border-amber-500/60 shadow-[inset_2px_0_0_0_rgba(251,191,36,1)]',
                                    badgeClass: 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20',
                                    textClass: 'text-amber-400'
                                }
                            case 'SILVER':
                                return {
                                    cardClass: 'bg-[#050505] border-slate-400/30 hover:border-slate-400/60 shadow-[inset_2px_0_0_0_rgba(148,163,184,1)]',
                                    badgeClass: 'bg-slate-500/10 text-slate-300 font-bold border border-slate-500/20',
                                    textClass: 'text-slate-300'
                                }
                            case 'BRONZE':
                                return {
                                    cardClass: 'bg-[#050505] border-orange-600/30 hover:border-orange-600/60 shadow-[inset_2px_0_0_0_rgba(234,88,12,1)]',
                                    badgeClass: 'bg-orange-600/10 text-orange-500 font-bold border border-orange-600/20',
                                    textClass: 'text-orange-500'
                                }
                            default: // GUEST / MEMBER
                                return {
                                    cardClass: 'bg-[#0a0a0a] border-white/5 hover:border-white/10 shadow-[inset_2px_0_0_0_rgba(255,255,255,0.1)]',
                                    badgeClass: 'bg-white/5 text-gray-400 border border-white/10',
                                    textClass: 'text-gray-400'
                                }
                        }
                    }

                    const style = getLevelData(tx.user?.level)

                    return (
                        <div key={tx.id} className={`rounded-xl overflow-hidden transition-colors group border relative ${style.cardClass}`}>
                            <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative z-10">
                                {/* 1. Identity (Col Span 3) */}
                                <div className="lg:col-span-3 min-w-0 pl-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-[10px] text-gray-500">#{tx.id}</span>
                                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${tx.type === 'TOPUP' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                            {tx.type}
                                        </div>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-sm truncate flex items-center gap-2">
                                        {tx.nickname}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${style.badgeClass} flex items-center justify-center min-w-[50px]`}>
                                            {tx.user?.level || 'GUEST'}
                                        </span>
                                    </h3>
                                    <p className={`text-xs truncate font-medium ${style.textClass} mt-0.5`}>{tx.game?.name}</p>
                                </div>

                                {/* 2. User & Game ID (Col Span 2) */}
                                <div className="lg:col-span-2 min-w-0 space-y-1">
                                    {/* Editable Game ID */}
                                    <div className="flex items-center gap-1 text-xs">
                                        {editingDetail?.id === tx.id && editingDetail.field === 'GAME_ID' ? (
                                            <div className="flex items-center gap-1 w-full">
                                                <input
                                                    className="bg-black/50 border border-white/20 rounded px-1 py-0.5 text-[10px] text-white w-full"
                                                    value={editingDetail.value}
                                                    onChange={e => setEditingDetail({ ...editingDetail, value: e.target.value })}
                                                />
                                                <button onClick={handleSaveEdit} className="text-green-400"><Check size={12} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 group/edit w-full">
                                                <span className="font-mono text-gray-300 bg-white/5 px-1 py-0.5 rounded text-[10px] truncate">{tx.user_game_id || '-'}</span>
                                                {tx.status === 'PENDING' && (
                                                    <button onClick={() => handleStartEdit(tx.id, 'GAME_ID', tx.user_game_id || '')} className="text-gray-600 hover:text-white opacity-0 group-hover/edit:opacity-100 transition-opacity">
                                                        <Pencil size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono truncate">{tx.user_wa}</div>

                                    {/* Bank Info for Logged User (Compact) */}
                                    {tx.user?.bank_name && (
                                        <div className="text-[9px] text-gray-400 truncate border-t border-white/5 pt-1 mt-1">
                                            <span className="text-cyan-500">{tx.user.bank_name}</span> • {tx.user.account_number}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Value & Method (Col Span 3) */}
                                <div className="lg:col-span-3 min-w-0 grid grid-cols-2 gap-2 border-l border-white/5 pl-4">
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase">Chip</p>
                                        <p className="font-bold text-yellow-500 text-sm">
                                            {tx.amount_chip < 1
                                                ? `${(tx.amount_chip * 1000).toLocaleString()} M`
                                                : `${tx.amount_chip.toLocaleString()} B`
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase">Harga</p>
                                        <p className="font-bold text-white text-sm">Rp {tx.amount_money.toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2 pt-1 mt-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-gray-500">{tx.type === 'TOPUP' ? 'Metode:' : 'Tujuan:'}</span>
                                            <span className="text-[10px] text-cyan-400 font-medium truncate">
                                                {tx.type === 'TOPUP' ? (tx.paymentMethod?.name || '-') : (tx.withdrawMethod?.name || '-')}
                                            </span>
                                        </div>
                                        {/* WD Target Details */}
                                        {tx.type === 'WITHDRAW' && (
                                            <div className="mt-0.5">
                                                {editingDetail?.id === tx.id && editingDetail.field === 'TARGET' ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            className="bg-black/50 border border-white/20 rounded px-1 py-0.5 text-[10px] text-white w-full"
                                                            value={editingDetail.value}
                                                            onChange={e => setEditingDetail({ ...editingDetail, value: e.target.value })}
                                                        />
                                                        <button onClick={handleSaveEdit} className="text-green-400"><Check size={12} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 group/edit-target">
                                                        <span className="text-[10px] text-gray-400 block break-words truncate max-w-[150px]">{tx.target_payment_details || '-'}</span>
                                                        {tx.status === 'PENDING' && (
                                                            <button onClick={() => handleStartEdit(tx.id, 'TARGET', tx.target_payment_details || '')} className="text-gray-600 hover:text-white opacity-0 group-hover/edit-target:opacity-100 transition-opacity">
                                                                <Pencil size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 4. Proof & Status (Col Span 2) */}
                                <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2">
                                    {tx.proof_image ? (
                                        tx.proof_image === 'MANUAL_ENTRY' ? (
                                            <div className="w-10 h-10 bg-cyan-900/20 rounded flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                                                <Check size={14} />
                                            </div>
                                        ) : (
                                            <div onClick={() => setPreviewImage(tx.proof_image)} className="group/img cursor-pointer relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={tx.proof_image} alt="Bukti" className="w-10 h-10 object-cover rounded border border-white/10 hover:scale-125 transition-transform origin-center z-10" />
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-[8px] text-gray-600">No Img</div>
                                    )}
                                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold border ${tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                        tx.status.includes('APPROVED') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {tx.status.replace('_', ' ')}
                                    </div>
                                </div>

                                {/* 5. Actions (Col Span 2) */}
                                <div className="lg:col-span-2 text-right">
                                    {tx.status === 'DECLINED' || tx.status === 'APPROVED_2' ? (
                                        <div className="flex justify-end">
                                            <span className="text-[10px] font-medium text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Check size={10} /> Selesai
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* ACTION LOGIC (Compact) */}
                                            {tx.type === 'TOPUP' && (
                                                <>
                                                    {tx.status === 'PENDING' && (
                                                        <div className="flex gap-1 justify-end">
                                                            <button
                                                                disabled={processingId === tx.id}
                                                                onClick={() => handleApproval(tx.id, 1, 'APPROVE', 'TOPUP')}
                                                                className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-[10px] font-bold disabled:opacity-50"
                                                            >
                                                                {processingId === tx.id ? 'Loading...' : 'Terima'}
                                                            </button>
                                                            <button
                                                                disabled={processingId === tx.id}
                                                                onClick={() => handleApproval(tx.id, 1, 'DECLINE', 'TOPUP')}
                                                                className="px-3 bg-white/5 hover:bg-red-500/20 text-red-400 py-1.5 rounded text-[10px] disabled:opacity-50"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </div>
                                                    )}
                                                    {tx.status === 'APPROVED_1' && (
                                                        <div className="space-y-1">
                                                            <select
                                                                className="w-full bg-black/40 border border-white/10 rounded p-1 text-[10px] text-white outline-none"
                                                                value={selectedAccountId}
                                                                onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : '')}
                                                            >
                                                                <option value="">Pilih ID...</option>
                                                                {localGameAccounts.map(acc => (
                                                                    <option key={acc.id} value={acc.id} className="text-black">
                                                                        {acc.username}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-1 justify-end">
                                                                <button disabled={processingId === tx.id} onClick={() => handleApproval(tx.id, 2, 'APPROVE', 'TOPUP')} className="px-3 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-[10px] font-bold disabled:opacity-50">
                                                                    {processingId === tx.id ? 'Sending...' : 'Kirim'}
                                                                </button>
                                                                <button disabled={processingId === tx.id} onClick={() => handleApproval(tx.id, 2, 'DECLINE', 'TOPUP')} className="px-3 bg-white/5 hover:bg-red-500/20 text-red-400 py-1.5 rounded text-[10px] disabled:opacity-50">Batal</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {tx.type === 'WITHDRAW' && (
                                                <>
                                                    {tx.status === 'PENDING' && (
                                                        <div className="space-y-1">
                                                            <select
                                                                className="w-full bg-black/40 border border-white/10 rounded p-1 text-[10px] text-white outline-none"
                                                                value={selectedAccountId}
                                                                onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : '')}
                                                            >
                                                                <option value="">Pilih ID...</option>
                                                                {localGameAccounts.map(acc => (
                                                                    <option key={acc.id} value={acc.id} className="text-black">
                                                                        {acc.username}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-1 justify-end">
                                                                <button
                                                                    disabled={processingId === tx.id}
                                                                    onClick={() => handleApproval(tx.id, 1, 'APPROVE', 'WITHDRAW')}
                                                                    className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-[10px] font-bold disabled:opacity-50"
                                                                >
                                                                    {processingId === tx.id ? 'Loading...' : 'Terima'}
                                                                </button>
                                                                <button
                                                                    disabled={processingId === tx.id}
                                                                    onClick={() => handleApproval(tx.id, 1, 'DECLINE', 'WITHDRAW')}
                                                                    className="px-3 bg-white/5 hover:bg-red-500/20 text-red-400 py-1.5 rounded text-[10px] disabled:opacity-50"
                                                                >
                                                                    Tolak
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {tx.status === 'APPROVED_1' && (
                                                        <div className="space-y-1">
                                                            <select
                                                                className="w-full bg-black/40 border border-white/10 rounded p-1 text-[10px] text-white outline-none"
                                                                value={selectedBankId}
                                                                onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : '')}
                                                            >
                                                                <option value="">Pilih Bank...</option>
                                                                {localBanks.map(bank => (
                                                                    <option key={bank.id} value={bank.id} className="text-black">
                                                                        {bank.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-1 justify-end">
                                                                <button disabled={processingId === tx.id} onClick={() => handleApproval(tx.id, 2, 'APPROVE', 'WITHDRAW')} className="px-3 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-[10px] font-bold disabled:opacity-50">
                                                                    {processingId === tx.id ? 'Sending...' : 'Transfer'}
                                                                </button>
                                                                <button disabled={processingId === tx.id} onClick={() => handleApproval(tx.id, 2, 'DECLINE', 'WITHDRAW')} className="px-3 bg-white/5 hover:bg-red-500/20 text-red-400 py-1.5 rounded text-[10px] disabled:opacity-50">Batal</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {!loading && transactions.length === 0 && (
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
