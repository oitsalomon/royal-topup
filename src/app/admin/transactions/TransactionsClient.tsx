'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import Image from 'next/image'
import {
    Check,
    X,
    Clock,
    Pencil,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ImageOff,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    AlertCircle,
    Trophy,
    TrendingUp,
    TrendingDown,
    Search,
    Info,
    RotateCcw
} from 'lucide-react'
import DateTimePickerRange, { DateTimeRangeValue } from '@/components/admin/DateTimePickerRange'
import { parseJakartaDateTime, getJakartaTodayRange, formatJakartaDisplay } from '@/lib/timezone'
import type { PeriodStats } from '@/services/transactions'

interface Transaction {
    id: number
    trx_id?: string | null
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
    initialPagination: { totalPages: number; page: number; total?: number }
    initialStats: PeriodStats
    initialDateRange: {
        startDateStr: string
        startTimeStr: string
        endDateStr: string
        endTimeStr: string
    }
    isAllTimeFallback?: boolean
    gameAccounts: any[]
    banks: any[]
}

export default function TransactionsClient({
    initialTransactions,
    initialPagination,
    initialStats,
    initialDateRange,
    isAllTimeFallback = false,
    gameAccounts,
    banks
}: TransactionsClientProps) {
    const [isPending, startTransition] = useTransition()
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
    const [pagination, setPagination] = useState(initialPagination)
    const [stats, setStats] = useState<PeriodStats>(initialStats)
    const [localGameAccounts] = useState<any[]>(gameAccounts)
    const [localBanks] = useState<any[]>(banks)
    const [loading, setLoading] = useState(false)

    // Admin Session ID
    const [currentAdminId, setCurrentAdminId] = useState<number>(1)

    // A1 Date-Time Range State (Default: Today 00:00 - 23:59 WIB, atau Semua Waktu jika fallback)
    const [dateRange, setDateRange] = useState<DateTimeRangeValue>(initialDateRange)

    // A3 Filter State
    const [filterType, setFilterType] = useState<'all' | 'TOPUP' | 'WITHDRAW'>('all')
    const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'APPROVED' | 'DECLINED'>('all')
    const [filterBank, setFilterBank] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [localSearchQuery, setLocalSearchQuery] = useState('')
    const [page, setPage] = useState(initialPagination.page || 1)

    // Selection & Editing
    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('')
    const [selectedBankId, setSelectedBankId] = useState<number | ''>('')
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [editingDetail, setEditingDetail] = useState<{ id: number; field: 'TARGET' | 'GAME_ID'; value: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [processingId, setProcessingId] = useState<number | null>(null)

    // Load admin ID from localStorage
    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) setCurrentAdminId(Number(user.id))
            }
        } catch { }
    }, [])

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' }
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) headers['X-User-Id'] = String(user.id)
            }
        } catch { }
        return headers
    }

    // Fetch transactions with server-side pagination and SQL aggregation
    const fetchData = useCallback(async (customPage?: number, skipStats?: boolean) => {
        setLoading(true)
        try {
            const targetPage = customPage !== undefined ? customPage : page
            const params = new URLSearchParams()
            params.append('page', targetPage.toString())
            params.append('limit', '20')

            // Date range converted to UTC ISO using IANA Asia/Jakarta parser (jika dispesifikasikan)
            if (dateRange.startDateStr && dateRange.endDateStr) {
                const startUTC = parseJakartaDateTime(dateRange.startDateStr, dateRange.startTimeStr || '00:00')
                const endUTC = new Date(parseJakartaDateTime(dateRange.endDateStr, dateRange.endTimeStr || '23:59').getTime() + 59999)
                params.append('startDate', startUTC.toISOString())
                params.append('endDate', endUTC.toISOString())
            }

            if (filterType !== 'all') params.append('type', filterType)
            if (filterStatus !== 'all') params.append('status', filterStatus)
            if (filterBank !== 'all') params.append('bank_id', filterBank)
            if (searchQuery.trim()) params.append('search', searchQuery.trim())
            if (skipStats) params.append('includeStats', 'false')

            const res = await fetch(`/api/transactions?${params.toString()}`, {
                headers: getAuthHeaders()
            })
            const result = await res.json()

            if (result && result.data) {
                setTransactions(result.data)
                setPagination(result.pagination || { totalPages: 1, page: targetPage, total: 0 })
                if (result.stats) {
                    setStats(result.stats)
                }
            }
        } catch (err) {
            console.error('Fetch transactions error:', err)
        } finally {
            setLoading(false)
        }
    }, [page, dateRange, filterType, filterStatus, filterBank, searchQuery])

    // Trigger fetch on filter / page changes (avoiding duplicate on initial SSR mount)
    const [isMounted, setIsMounted] = useState(false)
    const prevFilterRef = useRef({ dateRange, filterType, filterStatus, filterBank, searchQuery })

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true)
            return
        }

        const filtersChanged = (
            prevFilterRef.current.dateRange.startDateStr !== dateRange.startDateStr ||
            prevFilterRef.current.dateRange.startTimeStr !== dateRange.startTimeStr ||
            prevFilterRef.current.dateRange.endDateStr !== dateRange.endDateStr ||
            prevFilterRef.current.dateRange.endTimeStr !== dateRange.endTimeStr ||
            prevFilterRef.current.filterType !== filterType ||
            prevFilterRef.current.filterStatus !== filterStatus ||
            prevFilterRef.current.filterBank !== filterBank ||
            prevFilterRef.current.searchQuery !== searchQuery
        )

        prevFilterRef.current = { dateRange, filterType, filterStatus, filterBank, searchQuery }

        // If only page changed (pure pagination), skip heavy stats recalculation
        fetchData(page, !filtersChanged)
    }, [page, dateRange, filterType, filterStatus, filterBank, searchQuery])

    // Debounce search query input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearchQuery !== searchQuery) {
                setSearchQuery(localSearchQuery)
                setPage(1)
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [localSearchQuery, searchQuery])

    // Auto-refresh silent polling every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const silentRefresh = async () => {
                try {
                    const params = new URLSearchParams()
                    params.append('page', page.toString())
                    params.append('limit', '20')
                    if (dateRange.startDateStr && dateRange.endDateStr) {
                        const startUTC = parseJakartaDateTime(dateRange.startDateStr, dateRange.startTimeStr || '00:00')
                        const endUTC = new Date(parseJakartaDateTime(dateRange.endDateStr, dateRange.endTimeStr || '23:59').getTime() + 59999)
                        params.append('startDate', startUTC.toISOString())
                        params.append('endDate', endUTC.toISOString())
                    }
                    if (filterType !== 'all') params.append('type', filterType)
                    if (filterStatus !== 'all') params.append('status', filterStatus)
                    if (filterBank !== 'all') params.append('bank_id', filterBank)
                    if (searchQuery.trim()) params.append('search', searchQuery.trim())

                    const res = await fetch(`/api/transactions?${params.toString()}`, {
                        headers: getAuthHeaders()
                    })
                    const result = await res.json()
                    if (result?.data) {
                        setTransactions(prev => {
                            const prevFingerprint = prev.map(t => `${t.id}:${t.status}`).join(',')
                            const nextFingerprint = result.data.map((t: any) => `${t.id}:${t.status}`).join(',')
                            return prevFingerprint === nextFingerprint ? prev : result.data
                        })
                        if (result.stats) setStats(result.stats)
                    }
                } catch { }
            }
            silentRefresh()
        }, 15000)
        return () => clearInterval(interval)
    }, [page, dateRange, filterType, filterStatus, filterBank, searchQuery])

    // Reset date range handler
    const handleResetDate = () => {
        const today = getJakartaTodayRange()
        setDateRange({
            startDateStr: today.startDateStr,
            startTimeStr: today.startTimeStr,
            endDateStr: today.endDateStr,
            endTimeStr: today.endTimeStr
        })
        setPage(1)
    }

    // Editable fields handler
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
                setTransactions(prev => prev.map(t => {
                    if (t.id !== editingDetail.id) return t
                    return {
                        ...t,
                        target_payment_details: editingDetail.field === 'TARGET' ? editingDetail.value : t.target_payment_details,
                        user_game_id: editingDetail.field === 'GAME_ID' ? editingDetail.value : t.user_game_id
                    }
                }))
                setEditingDetail(null)
            } else {
                alert('Gagal update data')
            }
        } catch (e) {
            console.error(e)
            alert('Terjadi kesalahan saat menyimpan data.')
        } finally {
            setSaving(false)
        }
    }

    // C3: Optimistic Approval / Decline Action
    const handleApproval = async (id: number, stage: number, action: 'APPROVE' | 'DECLINE', type: 'TOPUP' | 'WITHDRAW') => {
        if (processingId) return

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

        // Snapshot previous state for rollback on error
        const previousTransactions = [...transactions]
        const previousStats = { ...stats }

        // Compute optimistic status
        let nextStatus = 'PENDING'
        if (action === 'DECLINE') {
            nextStatus = 'DECLINED'
        } else if (type === 'TOPUP') {
            nextStatus = stage === 1 ? 'APPROVED_1' : 'APPROVED_2'
        } else if (type === 'WITHDRAW') {
            nextStatus = stage === 1 ? 'APPROVED_1' : 'APPROVED_2'
        }

        // Optimistic UI Update (Immediate feedback)
        setTransactions(prev => prev.map(t => (t.id === id ? { ...t, status: nextStatus } : t)))
        if (action === 'APPROVE' || action === 'DECLINE') {
            setStats(prev => ({
                ...prev,
                pendingCount: Math.max(0, prev.pendingCount - (stage === 1 ? 1 : 0))
            }))
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
                alert(`KONFLIK: ${data.error}`)
                setTransactions(previousTransactions)
                setStats(previousStats)
                fetchData()
                return
            }

            if (!res.ok) {
                const data = await res.json()
                alert(`Gagal: ${data.error || 'Terjadi kesalahan sistem'}`)
                // Rollback optimistic update
                setTransactions(previousTransactions)
                setStats(previousStats)
            } else {
                // Success: clear inputs and refresh stats in background
                setSelectedAccountId('')
                setSelectedBankId('')
                fetchData()
            }
        } catch (error) {
            console.error('Approval request failed:', error)
            alert('Kesalahan koneksi ke server.')
            setTransactions(previousTransactions)
            setStats(previousStats)
        } finally {
            setProcessingId(null)
        }
    }

    // Helper: Level visual styling
    const getLevelData = (level?: string) => {
        switch (level) {
            case 'DIAMOND':
                return {
                    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
                    borderClass: 'border-l-cyan-500'
                }
            case 'PLATINUM':
                return {
                    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
                    borderClass: 'border-l-fuchsia-500'
                }
            case 'GOLD':
                return {
                    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    borderClass: 'border-l-amber-500'
                }
            case 'SILVER':
                return {
                    badgeClass: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
                    borderClass: 'border-l-slate-400'
                }
            case 'BRONZE':
                return {
                    badgeClass: 'bg-orange-600/15 text-orange-400 border-orange-600/30',
                    borderClass: 'border-l-orange-500'
                }
            default:
                return {
                    badgeClass: 'bg-white/5 text-gray-400 border-white/10',
                    borderClass: 'border-l-white/20'
                }
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Title & Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[#f3ecd8] tracking-tight">Manajemen Transaksi</h1>
                        <button
                            onClick={() => fetchData()}
                            disabled={loading}
                            className={`p-2 bg-[#c5a369]/10 text-[#c5a369] rounded-lg hover:bg-[#c5a369]/20 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Kelola verifikasi Top Up & Withdraw secara real-time. Menampilkan halaman {pagination.page} dari {pagination.totalPages || 1} ({pagination.total || 0} transaksi)
                    </p>
                </div>

                {/* A1: Calendar Date-Time Range Picker */}
                <div className="w-full lg:w-auto flex items-center justify-start lg:justify-end">
                    <DateTimePickerRange
                        value={dateRange}
                        onChange={(newRange) => {
                            setDateRange(newRange)
                            setPage(1)
                        }}
                        onReset={handleResetDate}
                    />
                </div>
            </div>

            {/* Banner Fallback All-Time jika hari ini belum ada transaksi */}
            {isAllTimeFallback && !dateRange.startDateStr && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-md">
                    <div className="flex items-center gap-2.5">
                        <Info size={16} className="text-amber-400 shrink-0" />
                        <span>
                            <strong>Periode Hari Ini Kosong:</strong> Belum ada transaksi baru yang masuk pada hari ini. Menampilkan riwayat transaksi lengkap sebelumnya agar Anda tetap dapat memantau data.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetDate}
                        className="underline text-amber-200 hover:text-white font-semibold text-xs shrink-0 self-end sm:self-auto cursor-pointer transition-colors"
                    >
                        Filter Hari Ini Saja
                    </button>
                </div>
            )}

            {/* A2: Active Period Stat Bar */}
            <div className="bg-[#17171a] border border-[#c5a369]/25 rounded-2xl p-4 shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-white/5">
                    {/* Total Top Up */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <ArrowUpRight size={15} strokeWidth={2} />
                            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Top Up</span>
                        </div>
                        <div className="font-bold text-white text-base">
                            {stats.totalTopupChip >= 1
                                ? `${stats.totalTopupChip.toFixed(1)} B`
                                : `${(stats.totalTopupChip * 1000).toLocaleString('id-ID')} M`
                            }
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                            Rp {stats.totalTopupNom.toLocaleString('id-ID')}
                        </div>
                    </div>

                    {/* Total Withdraw */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-rose-400">
                            <ArrowDownLeft size={15} strokeWidth={2} />
                            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Withdraw</span>
                        </div>
                        <div className="font-bold text-white text-base">
                            {stats.totalWdChip >= 1
                                ? `${stats.totalWdChip.toFixed(1)} B`
                                : `${(stats.totalWdChip * 1000).toLocaleString('id-ID')} M`
                            }
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                            Rp {stats.totalWdNom.toLocaleString('id-ID')}
                        </div>
                    </div>

                    {/* Net (Top Up - WD) */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#c5a369]">
                            <Wallet size={15} strokeWidth={2} />
                            <span className="font-semibold uppercase tracking-wider text-[11px]">Net Periode</span>
                        </div>
                        <div className={`font-bold text-base ${stats.netChip >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stats.netChip >= 0 ? '+' : ''}{stats.netChip.toFixed(1)} B
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                            {stats.netNom >= 0 ? '+' : ''}Rp {stats.netNom.toLocaleString('id-ID')}
                        </div>
                    </div>

                    {/* Pending Count */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                            <AlertCircle size={15} strokeWidth={2} />
                            <span className="font-semibold uppercase tracking-wider text-[11px]">Pending Approval</span>
                        </div>
                        <div className="font-bold text-white text-base">
                            {stats.pendingCount}{' '}
                            <span className="text-xs font-normal text-gray-400">transaksi</span>
                        </div>
                        <div className="text-[11px]">
                            {stats.pendingCount > 0 ? (
                                <span className="text-amber-400/90 font-medium">Perlu tindakan segera</span>
                            ) : (
                                <span className="text-gray-500">Semua telah diproses</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top 3 Spenders & Top 3 WD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
                    {/* Top 3 Top Up */}
                    <div className="flex items-start gap-2 text-gray-300">
                        <Trophy size={15} className="text-[#c5a369] shrink-0 mt-0.5" strokeWidth={1.8} />
                        <div className="min-w-0">
                            <span className="font-semibold text-[#f3ecd8] mr-1.5">Top Spender:</span>
                            {stats.top3Topup && stats.top3Topup.length > 0 ? (
                                <span className="text-gray-400 font-mono">
                                    {stats.top3Topup.map((t, i) => (
                                        <span key={i} className="inline-block mr-2">
                                            <strong className="text-white">{t.user_game_id}</strong> (Rp {t.amount_money.toLocaleString('id-ID')})
                                            {i < stats.top3Topup.length - 1 ? ' ·' : ''}
                                        </span>
                                    ))}
                                </span>
                            ) : (
                                <span className="text-gray-500 italic">Belum ada transaksi</span>
                            )}
                        </div>
                    </div>

                    {/* Top 3 WD */}
                    <div className="flex items-start gap-2 text-gray-300">
                        <TrendingDown size={15} className="text-rose-400 shrink-0 mt-0.5" strokeWidth={1.8} />
                        <div className="min-w-0">
                            <span className="font-semibold text-[#f3ecd8] mr-1.5">Top WD:</span>
                            {stats.top3Wd && stats.top3Wd.length > 0 ? (
                                <span className="text-gray-400 font-mono">
                                    {stats.top3Wd.map((w, i) => (
                                        <span key={i} className="inline-block mr-2">
                                            <strong className="text-white">{w.user_game_id}</strong> (Rp {w.amount_money.toLocaleString('id-ID')})
                                            {i < stats.top3Wd.length - 1 ? ' ·' : ''}
                                        </span>
                                    ))}
                                </span>
                            ) : (
                                <span className="text-gray-500 italic">Belum ada transaksi</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* A3: Filter Tabs (Type & Status) & Search */}
            <div className="space-y-3">
                {/* Row 1: Type Tabs & Status Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Tipe Tabs */}
                    <div className="flex items-center p-1 bg-[#17171a] border border-white/10 rounded-xl">
                        <button
                            onClick={() => { setFilterType('all'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterType === 'all'
                                    ? 'bg-[#c5a369] text-black font-semibold shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Semua Tipe
                        </button>
                        <button
                            onClick={() => { setFilterType('TOPUP'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterType === 'TOPUP'
                                    ? 'bg-[#c5a369] text-black font-semibold shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Top Up
                        </button>
                        <button
                            onClick={() => { setFilterType('WITHDRAW'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterType === 'WITHDRAW'
                                    ? 'bg-[#c5a369] text-black font-semibold shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Withdraw
                        </button>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center p-1 bg-[#17171a] border border-white/10 rounded-xl">
                        <button
                            onClick={() => { setFilterStatus('all'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterStatus === 'all'
                                    ? 'bg-white/15 text-white font-semibold'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Semua Status
                        </button>
                        <button
                            onClick={() => { setFilterStatus('PENDING'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterStatus === 'PENDING'
                                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => { setFilterStatus('APPROVED'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterStatus === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Approved
                        </button>
                        <button
                            onClick={() => { setFilterStatus('DECLINED'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterStatus === 'DECLINED'
                                    ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Declined
                        </button>
                    </div>
                </div>

                {/* Row 2: Auto-detect Search & Bank Selector */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Cari Royal ID / No WA / Nickname..."
                            className="w-full bg-[#17171a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-xs outline-none focus:border-[#c5a369] transition-colors"
                            value={localSearchQuery}
                            onChange={(e) => setLocalSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-[#17171a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#c5a369] transition-colors min-w-[160px]"
                        value={filterBank}
                        onChange={(e) => { setFilterBank(e.target.value); setPage(1); }}
                    >
                        <option value="all">Semua Bank</option>
                        {localBanks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* A4: Transaction Rows (Compact 2-Row Format, ~90-100px height, 12px padding) */}
            <div className="space-y-2.5">
                {loading && (
                    <div className="space-y-2 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-[#17171a] h-24 rounded-xl border border-white/5"></div>
                        ))}
                    </div>
                )}

                {!loading && transactions.map((tx) => {
                    const style = getLevelData(tx.user?.level)
                    const isPendingAction = tx.status === 'PENDING' || tx.status === 'APPROVED_1'

                    return (
                        <div
                            key={tx.id}
                            className={`bg-[#17171a] border border-white/10 hover:border-[#c5a369]/40 rounded-xl p-3 transition-colors border-l-4 ${style.borderClass}`}
                        >
                            {/* Row 1: Identitas, Status, Jam, Nickname, Level (whitespace-nowrap) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5 text-xs whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-gray-500 font-bold">#{tx.id}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                        tx.type === 'TOPUP'
                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                            : 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                                    }`}>
                                        {tx.type}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        tx.status === 'PENDING'
                                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                                            : tx.status.includes('APPROVED')
                                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                                                : 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                                    }`}>
                                        {tx.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                                        <Clock size={11} className="text-gray-500" />
                                        {formatJakartaDisplay(tx.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold text-xs truncate max-w-[160px]">
                                        {tx.nickname}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${style.badgeClass}`}>
                                        {tx.user?.level || 'GUEST'}
                                    </span>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        {tx.game?.name}
                                    </span>
                                </div>
                            </div>

                            {/* Row 2: Royal ID, Single WA, Amount Chip, Amount Rp, Target/Method, Proof Image, Action Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2 text-xs">
                                {/* Royal ID & Single WA (Col 3) */}
                                <div className="md:col-span-3 min-w-0 space-y-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] text-gray-400">ID:</span>
                                        {editingDetail?.id === tx.id && editingDetail.field === 'GAME_ID' ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    className="bg-black border border-white/20 rounded px-1.5 py-0.5 text-xs text-white w-28"
                                                    value={editingDetail.value}
                                                    onChange={e => setEditingDetail({ ...editingDetail, value: e.target.value })}
                                                />
                                                <button onClick={handleSaveEdit} disabled={saving} className="text-emerald-400">
                                                    <Check size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 group/edit">
                                                <span className="font-mono text-white bg-white/5 px-1.5 py-0.5 rounded text-xs font-semibold">
                                                    {tx.user_game_id || '-'}
                                                </span>
                                                {tx.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleStartEdit(tx.id, 'GAME_ID', tx.user_game_id || '')}
                                                        className="text-gray-500 hover:text-white opacity-0 group-hover/edit:opacity-100 transition-opacity"
                                                        title="Edit Game ID"
                                                    >
                                                        <Pencil size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Single WhatsApp display */}
                                    <div className="text-[11px] text-gray-400 font-mono truncate">
                                        WA: <span className="text-gray-300">{tx.user_wa}</span>
                                    </div>
                                </div>

                                {/* Nominal Chip & Rupiah (Col 3) */}
                                <div className="md:col-span-3 min-w-0 flex items-center justify-between md:justify-start md:gap-4 border-l border-white/5 pl-2">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Chip</p>
                                        <p className="font-bold text-[#c5a369] text-xs">
                                            {tx.amount_chip < 1
                                                ? `${(tx.amount_chip * 1000).toLocaleString('id-ID')} M`
                                                : `${tx.amount_chip.toLocaleString('id-ID')} B`
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Nominal</p>
                                        <p className="font-bold text-white text-xs font-mono">
                                            Rp {tx.amount_money.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Method / Tujuan WD (Col 2) */}
                                <div className="md:col-span-2 min-w-0 border-l border-white/5 pl-2">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                                        {tx.type === 'TOPUP' ? 'Metode' : 'Tujuan WD'}
                                    </p>
                                    <p className="text-xs text-cyan-300 font-medium truncate">
                                        {tx.type === 'TOPUP' ? (tx.paymentMethod?.name || '-') : (tx.withdrawMethod?.name || '-')}
                                    </p>
                                    {tx.type === 'WITHDRAW' && tx.target_payment_details && (
                                        <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                                            {tx.target_payment_details}
                                        </p>
                                    )}
                                </div>

                                {/* Proof Image (Col 1) - Lucide ImageOff if no img */}
                                <div className="md:col-span-1 flex items-center justify-center">
                                    {tx.proof_image ? (
                                        tx.proof_image === 'MANUAL_ENTRY' ? (
                                            <div className="w-8 h-8 bg-cyan-900/20 rounded flex items-center justify-center text-cyan-400 border border-cyan-500/20" title="Manual Entry">
                                                <Check size={14} />
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => setPreviewImage(tx.proof_image)}
                                                className="cursor-pointer relative group"
                                                title="Klik untuk perbesar bukti"
                                            >
                                                <Image
                                                    src={tx.proof_image}
                                                    alt="Bukti"
                                                    width={32}
                                                    height={32}
                                                    className="w-8 h-8 object-cover rounded border border-white/10 group-hover:scale-110 transition-transform"
                                                    unoptimized
                                                />
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-white/5 text-white/20 border border-white/5" title="Tidak ada bukti foto">
                                            <ImageOff size={16} strokeWidth={1.5} />
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons (Col 3) */}
                                <div className="md:col-span-3 flex items-center justify-end gap-1.5">
                                    {tx.status === 'DECLINED' || tx.status === 'APPROVED_2' ? (
                                        <span className="text-[11px] font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            <Check size={12} /> Selesai
                                        </span>
                                    ) : isPendingAction ? (
                                        <div className="flex items-center gap-1.5 w-full justify-end">
                                            {/* Stage 1: TOPUP PENDING */}
                                            {tx.type === 'TOPUP' && tx.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 1, 'APPROVE', 'TOPUP')}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                                                    >
                                                        {processingId === tx.id ? '...' : 'Terima'}
                                                    </button>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 1, 'DECLINE', 'TOPUP')}
                                                        className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                                                    >
                                                        Tolak
                                                    </button>
                                                </>
                                            )}

                                            {/* Stage 2: TOPUP APPROVED_1 */}
                                            {tx.type === 'TOPUP' && tx.status === 'APPROVED_1' && (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        className="bg-black border border-white/20 rounded px-1.5 py-1 text-[11px] text-white outline-none max-w-[110px]"
                                                        value={selectedAccountId}
                                                        onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : '')}
                                                    >
                                                        <option value="">Panel ID...</option>
                                                        {localGameAccounts.map(acc => (
                                                            <option key={acc.id} value={acc.id} className="text-black">
                                                                {acc.username}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 2, 'APPROVE', 'TOPUP')}
                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                                                    >
                                                        Kirim
                                                    </button>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 2, 'DECLINE', 'TOPUP')}
                                                        className="px-2 py-1 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded text-xs disabled:opacity-50"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            )}

                                            {/* Stage 1: WITHDRAW PENDING */}
                                            {tx.type === 'WITHDRAW' && tx.status === 'PENDING' && (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        className="bg-black border border-white/20 rounded px-1.5 py-1 text-[11px] text-white outline-none max-w-[110px]"
                                                        value={selectedAccountId}
                                                        onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : '')}
                                                    >
                                                        <option value="">Panel ID...</option>
                                                        {localGameAccounts.map(acc => (
                                                            <option key={acc.id} value={acc.id} className="text-black">
                                                                {acc.username}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 1, 'APPROVE', 'WITHDRAW')}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                                                    >
                                                        Terima
                                                    </button>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 1, 'DECLINE', 'WITHDRAW')}
                                                        className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 rounded text-xs disabled:opacity-50"
                                                    >
                                                        Tolak
                                                    </button>
                                                </div>
                                            )}

                                            {/* Stage 2: WITHDRAW APPROVED_1 */}
                                            {tx.type === 'WITHDRAW' && tx.status === 'APPROVED_1' && (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        className="bg-black border border-white/20 rounded px-1.5 py-1 text-[11px] text-white outline-none max-w-[110px]"
                                                        value={selectedBankId}
                                                        onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : '')}
                                                    >
                                                        <option value="">Bank...</option>
                                                        {localBanks.map(bank => (
                                                            <option key={bank.id} value={bank.id} className="text-black">
                                                                {bank.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 2, 'APPROVE', 'WITHDRAW')}
                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                                                    >
                                                        Transfer
                                                    </button>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => handleApproval(tx.id, 2, 'DECLINE', 'WITHDRAW')}
                                                        className="px-2 py-1 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded text-xs disabled:opacity-50"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {!loading && transactions.length === 0 && (
                    <div className="text-center py-16 bg-[#17171a] rounded-2xl border border-white/5 border-dashed space-y-3 px-4">
                        <p className="text-sm font-semibold text-[#f3ecd8]">
                            {searchQuery ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada transaksi pada periode ini.'}
                        </p>
                        <p className="text-xs text-[#a89f8a] max-w-md mx-auto leading-relaxed">
                            {dateRange.startDateStr
                                ? 'Pilih rentang tanggal lain atau klik tombol di bawah untuk menampilkan seluruh riwayat transaksi tanpa batasan tanggal.'
                                : 'Saat ini belum ada data transaksi yang tercatat dalam sistem.'}
                        </p>
                        {dateRange.startDateStr && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateRange({ startDateStr: '', startTimeStr: '', endDateStr: '', endTimeStr: '' })
                                        setSearchQuery('')
                                        setLocalSearchQuery('')
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c5a369]/20 hover:bg-[#c5a369]/30 text-[#e8c883] border border-[#c5a369]/40 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    <span>Tampilkan Semua Waktu (Lihat Riwayat Lengkap)</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 pb-8">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="p-2 rounded-lg bg-[#17171a] border border-white/10 hover:border-[#c5a369]/50 disabled:opacity-30 transition-colors text-white"
                        title="Halaman Sebelumnya"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-gray-300 font-mono text-xs px-3">
                        Halaman {page} dari {pagination.totalPages}
                    </span>
                    <button
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        className="p-2 rounded-lg bg-[#17171a] border border-white/10 hover:border-[#c5a369]/50 disabled:opacity-30 transition-colors text-white"
                        title="Halaman Selanjutnya"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Proof Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center">
                        <Image
                            src={previewImage}
                            alt="Bukti Transfer"
                            width={700}
                            height={700}
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10"
                            unoptimized
                        />
                        <button
                            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
