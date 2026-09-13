'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Plus,
    Trash2,
    Power,
    ArrowUp,
    ArrowDown,
    Building2,
    Smartphone,
    Wallet,
    Search,
    CheckCircle2,
    AlertCircle,
    RotateCcw
} from 'lucide-react'

interface WithdrawMethod {
    id: number
    name: string
    type: 'BANK' | 'BANK_DIGITAL' | 'EWALLET' | string
    isActive: boolean
}

export default function WithdrawMethodsPage() {
    const [methods, setMethods] = useState<WithdrawMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [savingOrder, setSavingOrder] = useState(false)
    const [name, setName] = useState('')
    const [type, setType] = useState('BANK')
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'BANK' | 'BANK_DIGITAL' | 'EWALLET'>('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const showNotif = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 3000)
    }

    const fetchMethods = async () => {
        try {
            const res = await fetch('/api/internal/withdraw-methods')
            const data = await res.json()
            if (Array.isArray(data)) setMethods(data)
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMethods()
    }, [])

    const getAdminId = () => {
        try {
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : {}
            return String(user.id || '1')
        } catch {
            return '1'
        }
    }

    // Tambah Metode Baru
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            const res = await fetch('/api/internal/withdraw-methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': getAdminId()
                },
                body: JSON.stringify({ name: name.trim().toUpperCase(), type })
            })

            if (res.ok) {
                setName('')
                showNotif('success', `Metode ${name.toUpperCase()} berhasil ditambahkan`)
                fetchMethods()
            } else {
                const err = await res.json().catch(() => ({}))
                showNotif('error', err.error || 'Gagal menambahkan metode')
            }
        } catch (error) {
            console.error(error)
            showNotif('error', 'Terjadi kesalahan saat menambahkan metode')
        }
    }

    // Toggle Aktif / Non-aktif
    const handleToggle = async (id: number, current: boolean) => {
        try {
            const res = await fetch('/api/internal/withdraw-methods', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': getAdminId()
                },
                body: JSON.stringify({ id, isActive: !current })
            })

            if (res.ok) {
                setMethods(prev => prev.map(m => m.id === id ? { ...m, isActive: !current } : m))
                showNotif('success', `Status metode berhasil diubah`)
            } else {
                showNotif('error', 'Gagal mengubah status')
            }
        } catch (error) {
            console.error(error)
            showNotif('error', 'Terjadi kesalahan sistem')
        }
    }

    // Hapus Metode
    const handleDelete = async (id: number, methodName: string) => {
        if (!confirm(`Yakin ingin menghapus metode ${methodName}?`)) return

        try {
            const res = await fetch(`/api/internal/withdraw-methods?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': getAdminId()
                }
            })

            if (res.ok) {
                setMethods(prev => prev.filter(m => m.id !== id))
                showNotif('success', `Metode ${methodName} berhasil dihapus`)
            } else {
                showNotif('error', 'Gagal menghapus metode')
            }
        } catch (error) {
            console.error(error)
            showNotif('error', 'Terjadi kesalahan sistem')
        }
    }

    // Reorder: Geser Posisi Naik / Turun
    const handleMove = async (indexInOverall: number, direction: 'UP' | 'DOWN') => {
        if (savingOrder) return
        const targetIndex = direction === 'UP' ? indexInOverall - 1 : indexInOverall + 1
        if (targetIndex < 0 || targetIndex >= methods.length) return

        const updated = [...methods]
        const temp = updated[indexInOverall]
        updated[indexInOverall] = updated[targetIndex]
        updated[targetIndex] = temp

        setMethods(updated)
        setSavingOrder(true)

        try {
            const res = await fetch('/api/internal/withdraw-methods', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': getAdminId()
                },
                body: JSON.stringify({
                    newOrder: updated.map(m => m.id)
                })
            })

            if (res.ok) {
                showNotif('success', `Urutan metode berhasil diperbarui`)
            } else {
                showNotif('error', 'Gagal menyimpan urutan')
                fetchMethods()
            }
        } catch (error) {
            console.error('Reorder error:', error)
            showNotif('error', 'Terjadi kesalahan jaringan')
            fetchMethods()
        } finally {
            setSavingOrder(false)
        }
    }

    // Hitung ringkasan statistik
    const stats = useMemo(() => {
        const total = methods.length
        const bank = methods.filter(m => m.type === 'BANK').length
        const digital = methods.filter(m => m.type === 'BANK_DIGITAL').length
        const ewallet = methods.filter(m => m.type === 'EWALLET').length
        const active = methods.filter(m => m.isActive).length
        return { total, bank, digital, ewallet, active }
    }, [methods])

    // Filter berdasarkan kategori tab dan teks pencarian
    const filteredMethods = useMemo(() => {
        return methods.filter(m => {
            const matchCategory = filterCategory === 'ALL' || m.type === filterCategory
            const matchSearch = !searchQuery.trim() ||
                m.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                m.type.toLowerCase().includes(searchQuery.trim().toLowerCase())
            return matchCategory && matchSearch
        })
    }, [methods, filterCategory, searchQuery])

    return (
        <div className="max-w-6xl mx-auto space-y-6 font-inter text-[#f3ecd8] pb-16">
            
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#8a6d38]/20">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] tracking-tight">
                        Kelola Metode Pencairan (Bongkaran)
                    </h1>
                    <p className="text-xs sm:text-sm text-[#a89f8a] mt-1">
                        Atur 40+ metode Bank Konvensional, Bank Digital, dan E-Wallet serta urutan prioritas tampilan untuk customer.
                    </p>
                </div>
                {notification && (
                    <div className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border animate-in fade-in duration-200 ${
                        notification.type === 'success'
                            ? 'bg-[#3fa46a]/15 text-[#3fa46a] border-[#3fa46a]/40'
                            : 'bg-red-500/15 text-red-400 border-red-500/40'
                    }`}>
                        {notification.type === 'success' ? <CheckCircle2 size={14} strokeWidth={1.5} /> : <AlertCircle size={14} strokeWidth={1.5} />}
                        <span>{notification.message}</span>
                    </div>
                )}
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-[#131417] border border-[#8a6d38]/30 rounded-lg p-3.5 space-y-1">
                    <p className="text-[11px] text-[#a89f8a] uppercase tracking-wider">Total Metode</p>
                    <p className="text-xl font-bold font-mono text-[#f3ecd8]">{stats.total}</p>
                    <p className="text-[10px] text-[#3fa46a] font-medium">{stats.active} Aktif</p>
                </div>
                <div className="bg-[#131417] border border-[#8a6d38]/30 rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center gap-1 text-[#c5a369]">
                        <Building2 size={13} strokeWidth={1.5} />
                        <p className="text-[11px] text-[#a89f8a] uppercase tracking-wider">Konvensional</p>
                    </div>
                    <p className="text-xl font-bold font-mono text-[#f3ecd8]">{stats.bank}</p>
                    <p className="text-[10px] text-[#a89f8a]">BCA, Mandiri, BRI, dll</p>
                </div>
                <div className="bg-[#131417] border border-[#8a6d38]/30 rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center gap-1 text-[#3fa46a]">
                        <Smartphone size={13} strokeWidth={1.5} />
                        <p className="text-[11px] text-[#a89f8a] uppercase tracking-wider">Bank Digital</p>
                    </div>
                    <p className="text-xl font-bold font-mono text-[#f3ecd8]">{stats.digital}</p>
                    <p className="text-[10px] text-[#a89f8a]">Seabank, Blu, Allo, dll</p>
                </div>
                <div className="bg-[#131417] border border-[#8a6d38]/30 rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center gap-1 text-[#00b2ff]">
                        <Wallet size={13} strokeWidth={1.5} />
                        <p className="text-[11px] text-[#a89f8a] uppercase tracking-wider">E-Wallet</p>
                    </div>
                    <p className="text-xl font-bold font-mono text-[#f3ecd8]">{stats.ewallet}</p>
                    <p className="text-[10px] text-[#a89f8a]">DANA, GoPay, OVO, dll</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-[#131417] border border-[#8a6d38]/30 rounded-lg p-3.5 space-y-1">
                    <p className="text-[11px] text-[#a89f8a] uppercase tracking-wider">Prioritas Teratas</p>
                    <p className="text-xs font-semibold text-[#c5a369] truncate">
                        {methods[0]?.name || '-'}
                    </p>
                    <p className="text-[10px] text-[#a89f8a]">Gunakan panah naik/turun</p>
                </div>
            </div>

            {/* Form Tambah Metode Baru */}
            <div className="bg-[#131417] border border-[#8a6d38]/35 rounded-lg p-4 sm:p-5 space-y-3">
                <h3 className="font-poppins font-bold text-sm text-[#f3ecd8] uppercase tracking-wide">
                    Tambah Metode Baru
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Nama Bank atau E-Wallet (Contoh: KROM BANK)"
                        className="flex-1 bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2 text-xs font-inter text-[#f3ecd8] outline-none transition-colors"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <select
                        className="bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3 py-2 text-xs font-inter text-[#f3ecd8] outline-none cursor-pointer"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="BANK">Bank Konvensional</option>
                        <option value="BANK_DIGITAL">Bank Digital</option>
                        <option value="EWALLET">E-Wallet (Dompet Digital)</option>
                    </select>
                    <button
                        type="submit"
                        className="bg-[#c5a369] hover:bg-[#d8b87d] text-black font-poppins font-semibold text-xs px-5 py-2 rounded-md flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
                    >
                        <Plus size={15} strokeWidth={1.5} />
                        <span>Tambah Metode</span>
                    </button>
                </form>
            </div>

            {/* Controls: Search & Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Category Tabs */}
                <div className="flex items-center p-1 bg-[#131417] border border-[#8a6d38]/30 rounded-lg overflow-x-auto text-xs">
                    <button
                        onClick={() => setFilterCategory('ALL')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                            filterCategory === 'ALL'
                                ? 'bg-[#c5a369] text-black font-semibold'
                                : 'text-[#a89f8a] hover:text-[#f3ecd8]'
                        }`}
                    >
                        Semua ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilterCategory('BANK')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                            filterCategory === 'BANK'
                                ? 'bg-[#c5a369] text-black font-semibold'
                                : 'text-[#a89f8a] hover:text-[#f3ecd8]'
                        }`}
                    >
                        Bank Konvensional ({stats.bank})
                    </button>
                    <button
                        onClick={() => setFilterCategory('BANK_DIGITAL')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                            filterCategory === 'BANK_DIGITAL'
                                ? 'bg-[#c5a369] text-black font-semibold'
                                : 'text-[#a89f8a] hover:text-[#f3ecd8]'
                        }`}
                    >
                        Bank Digital ({stats.digital})
                    </button>
                    <button
                        onClick={() => setFilterCategory('EWALLET')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                            filterCategory === 'EWALLET'
                                ? 'bg-[#c5a369] text-black font-semibold'
                                : 'text-[#a89f8a] hover:text-[#f3ecd8]'
                        }`}
                    >
                        E-Wallet ({stats.ewallet})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[220px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a6d38]" strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Cari nama metode..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#f3ecd8] outline-none transition-colors"
                    />
                </div>
            </div>

            {/* List Table / Cards */}
            {loading ? (
                <div className="p-12 text-center text-xs text-[#a89f8a] bg-[#131417] border border-[#8a6d38]/20 rounded-lg">
                    Memuat daftar metode...
                </div>
            ) : filteredMethods.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#a89f8a] bg-[#131417] border border-[#8a6d38]/20 rounded-lg space-y-2">
                    <p>Tidak ada metode yang cocok dengan filter.</p>
                </div>
            ) : (
                <div className="bg-[#131417] border border-[#8a6d38]/30 rounded-lg divide-y divide-[#8a6d38]/15 overflow-hidden">
                    <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-poppins font-bold uppercase tracking-wider text-[#8a6d38] bg-[#0d0d0f]/60">
                        <div className="col-span-2 sm:col-span-1 text-center">Urutan</div>
                        <div className="col-span-6 sm:col-span-5">Nama Metode</div>
                        <div className="col-span-2 sm:col-span-3">Kategori</div>
                        <div className="col-span-2 sm:col-span-3 text-right">Aksi</div>
                    </div>

                    {filteredMethods.map(m => {
                        const overallIndex = methods.findIndex(item => item.id === m.id)
                        const isFirst = overallIndex === 0
                        const isLast = overallIndex === methods.length - 1

                        return (
                            <div
                                key={m.id}
                                className={`grid grid-cols-12 gap-3 px-4 py-3 items-center text-xs transition-colors ${
                                    m.isActive ? 'hover:bg-[#18191e]' : 'bg-[#0d0d0f]/40 opacity-70'
                                }`}
                            >
                                {/* Rank & Reorder Controls */}
                                <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1">
                                    <span className="font-mono font-bold text-[#c5a369] text-xs">
                                        #{overallIndex + 1}
                                    </span>
                                    <div className="flex flex-col -space-y-0.5">
                                        <button
                                            type="button"
                                            disabled={isFirst || savingOrder}
                                            onClick={() => handleMove(overallIndex, 'UP')}
                                            className="p-0.5 text-[#a89f8a] hover:text-[#c5a369] disabled:opacity-20 disabled:hover:text-[#a89f8a]"
                                            title="Pindah ke Atas"
                                        >
                                            <ArrowUp size={12} strokeWidth={1.5} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isLast || savingOrder}
                                            onClick={() => handleMove(overallIndex, 'DOWN')}
                                            className="p-0.5 text-[#a89f8a] hover:text-[#c5a369] disabled:opacity-20 disabled:hover:text-[#a89f8a]"
                                            title="Pindah ke Bawah"
                                        >
                                            <ArrowDown size={12} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </div>

                                {/* Nama Metode */}
                                <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
                                    <span className="font-poppins font-bold text-sm text-[#f3ecd8]">
                                        {m.name}
                                    </span>
                                    {!m.isActive && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                                            Nonaktif
                                        </span>
                                    )}
                                </div>

                                {/* Tipe Kategori */}
                                <div className="col-span-2 sm:col-span-3">
                                    {m.type === 'BANK' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#0d0d0f] border border-[#8a6d38]/30 text-[#a89f8a]">
                                            <Building2 size={11} strokeWidth={1.5} />
                                            <span>Bank Konvensional</span>
                                        </span>
                                    ) : m.type === 'BANK_DIGITAL' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#3fa46a]/10 border border-[#3fa46a]/30 text-[#3fa46a]">
                                            <Smartphone size={11} strokeWidth={1.5} />
                                            <span>Bank Digital</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#00b2ff]/10 border border-[#00b2ff]/30 text-[#00b2ff]">
                                            <Wallet size={11} strokeWidth={1.5} />
                                            <span>E-Wallet</span>
                                        </span>
                                    )}
                                </div>

                                {/* Aksi: Toggle Status & Hapus */}
                                <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(m.id, m.isActive)}
                                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                                            m.isActive
                                                ? 'bg-[#3fa46a]/15 text-[#3fa46a] border border-[#3fa46a]/40 hover:bg-[#3fa46a]/25'
                                                : 'bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25'
                                        }`}
                                        title={m.isActive ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                    >
                                        <Power size={12} strokeWidth={1.5} />
                                        <span className="hidden sm:inline">{m.isActive ? 'Aktif' : 'Nonaktif'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(m.id, m.name)}
                                        className="p-1 rounded bg-[#0d0d0f] border border-[#8a6d38]/30 hover:border-red-500/50 text-[#a89f8a] hover:text-red-400 transition-colors"
                                        title="Hapus Metode"
                                    >
                                        <Trash2 size={13} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
