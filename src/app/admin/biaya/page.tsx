'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Landmark, Trash2, Download, Database, CheckCircle2, AlertTriangle } from 'lucide-react'
import {
    PageHead, Panel, StatBig, Badge, PrimaryBtn,
    SelectInput, TextInput
} from '@/components/admin/RoyalCloverUI'
import { rp, DEFAULT_OPS_BANKS } from '@/lib/clover-engine'
import { getJakartaDateString, getJakartaTimeString } from '@/lib/timezone'

interface ExpenseRow {
    id: number
    amount: number
    category: string
    description: string
    bank_name: string | null
    createdAt: string
    user?: {
        id: number
        username: string
    }
}

export default function BiayaPage() {
    const [expenses, setExpenses] = useState<ExpenseRow[]>([])
    const [banks, setBanks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Legacy LocalStorage data detection & rescue
    const [localData, setLocalData] = useState<any[]>([])
    const [importingLocal, setImportingLocal] = useState(false)
    const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null)

    const [f, setF] = useState({
        rek: DEFAULT_OPS_BANKS[0]?.label || 'BCA',
        category: 'Admin Bank',
        biaya: '',
        ket: ''
    })

    const CATEGORIES = [
        'Admin Bank',
        'Pulsa CS',
        'Internet Kantor',
        'Operasional Kantor',
        'Konsumsi Staff',
        'Server & Domain',
        'Lainnya'
    ]

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/internal/expenses')
            if (res.ok) {
                const data = await res.json()
                setExpenses(data)
            }
        } catch (e) {
            console.error('Failed to fetch expenses:', e)
        } finally {
            setLoading(false)
        }
    }

    const fetchBanks = async () => {
        try {
            const res = await fetch('/api/internal/banks')
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data) && data.length > 0) {
                    setBanks(data.map((b: any) => ({
                        id: b.id,
                        label: `${b.name} - ${b.account_number} (${b.account_name})`
                    })))
                    if (data[0]) {
                        setF(prev => ({ ...prev, rek: `${data[0].name} (${data[0].account_name})` }))
                    }
                }
            }
        } catch {}
    }

    useEffect(() => {
        fetchExpenses()
        fetchBanks()

        // Check local storage
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('royal_ops_biaya')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setLocalData(parsed)
                    }
                }
            } catch {}
        }
    }, [])

    const handleAdd = async () => {
        const val = Number(f.biaya)
        if (!val || val <= 0) {
            alert('Nominal biaya harus lebih dari 0')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/internal/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: val,
                    category: f.category,
                    description: f.ket || f.category,
                    bank_name: f.rek
                })
            })

            if (res.ok) {
                const newRow = await res.json()
                setExpenses(prev => [newRow, ...prev])
                setF(prev => ({ ...prev, biaya: '', ket: '' }))
                setOpen(false)
            } else {
                const err = await res.json().catch(() => ({}))
                alert(err.error || 'Gagal menyimpan biaya operasional')
            }
        } catch (e) {
            console.error(e)
            alert('Terjadi kesalahan koneksi saat menyimpan')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus catatan pengeluaran ini dari database?')) return

        try {
            const res = await fetch(`/api/internal/expenses?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setExpenses(prev => prev.filter(r => r.id !== id))
            } else {
                alert('Gagal menghapus catatan')
            }
        } catch (e) {
            console.error(e)
            alert('Terjadi kesalahan saat menghapus')
        }
    }

    // Export localStorage to JSON file
    const handleExportLocalStorage = () => {
        if (!localData.length) return
        const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-biaya-local-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Import localStorage to database
    const handleImportLocalStorage = async () => {
        if (!localData.length) return
        if (!confirm(`Impor ${localData.length} data biaya dari browser lokal ke database server?`)) return

        setImportingLocal(true)
        let successCount = 0
        try {
            for (const item of localData) {
                const val = Number(item.biaya || item.amount || 0)
                if (val > 0) {
                    await fetch('/api/internal/expenses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: val,
                            category: item.ket?.includes('transfer') ? 'Admin Bank' : item.ket?.includes('pulsa') ? 'Pulsa CS' : 'Operasional',
                            description: item.ket || 'Impor dari local storage',
                            bank_name: item.rek || null
                        })
                    })
                    successCount++
                }
            }

            localStorage.removeItem('royal_ops_biaya')
            setLocalData([])
            setImportSuccessMsg(`Berhasil mengimpor ${successCount} data ke database server.`)
            await fetchExpenses()
        } catch (e) {
            console.error('Import error:', e)
            alert('Sebagian data gagal diimpor')
        } finally {
            setImportingLocal(false)
        }
    }

    const handleClearLocalStorage = () => {
        if (confirm('Hapus cache data lokal browser? Data di database server tetap aman.')) {
            localStorage.removeItem('royal_ops_biaya')
            setLocalData([])
        }
    }

    const grandTotal = useMemo(() => expenses.reduce((a, r) => a + Number(r.amount || 0), 0), [expenses])

    const summary = useMemo(() => {
        const m: Record<string, { ket: string; total: number; count: number }> = {}
        expenses.forEach((r) => {
            const key = (r.category || 'Lainnya').trim()
            if (!m[key]) m[key] = { ket: key, total: 0, count: 0 }
            m[key].total += Number(r.amount || 0)
            m[key].count++
        })
        return Object.values(m).sort((a, b) => b.total - a.total)
    }, [expenses])

    const bankOptions = banks.length > 0 ? banks.map(b => b.label) : DEFAULT_OPS_BANKS.map(b => b.label)

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Keuangan', 'Biaya Operasional']}
                title="Biaya Operasional"
                sub="Catatan pengeluaran kantor, pulsa CS, dan biaya admin transfer bank tersimpan di database"
                actions={
                    <PrimaryBtn onClick={() => setOpen(!open)}>
                        <Plus size={16} strokeWidth={1.5} /> Catat Biaya Baru
                    </PrimaryBtn>
                }
            />

            {/* LocalStorage Rescue Banner if found */}
            {localData.length > 0 && (
                <div className="p-4 bg-[#16181d] border border-[#f5b301]/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#f5b301]/10 border border-[#f5b301]/30 flex items-center justify-center text-[#f5b301] shrink-0">
                            <Database size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">
                                Ditemukan {localData.length} data catatan biaya lama di browser lokal ini
                            </div>
                            <div className="text-[11px] text-gray-400">
                                Anda dapat mengimpor data ini ke database server PostgreSQL atau mengekspornya sebagai file JSON.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={handleImportLocalStorage}
                            disabled={importingLocal}
                            className="px-3 py-1.5 bg-[#f5b301] hover:bg-[#d99e00] text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Database size={14} strokeWidth={1.5} />
                            <span>{importingLocal ? 'Mengimpor...' : 'Impor ke Database'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportLocalStorage}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Download size={14} strokeWidth={1.5} />
                            <span>Ekspor JSON</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleClearLocalStorage}
                            className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                            Abaikan
                        </button>
                    </div>
                </div>
            )}

            {importSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 size={15} strokeWidth={1.5} />
                    <span>{importSuccessMsg}</span>
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBig label="Total Pengeluaran Database" value={rp(grandTotal)} sub={`${expenses.length} pengeluaran tercatat`} />
                <StatBig label="Rata-rata per Transaksi" value={rp(expenses.length ? grandTotal / expenses.length : 0)} sub="Biaya per transaksi" />
                <StatBig label="Kategori Terbesar" value={summary[0]?.ket || '—'} sub={summary[0] ? rp(summary[0].total) : 'Rp 0'} />
            </div>

            {/* Rangkuman Biaya by Category */}
            <Panel title="Rangkuman Kategori" subtitle={`Total seluruh biaya: ${rp(grandTotal)}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {summary.map((g) => {
                        const pct = grandTotal ? (g.total / grandTotal) * 100 : 0
                        return (
                            <div key={g.ket} className="p-3.5 bg-[#0a0b0d] border border-[#26282f] rounded-xl">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-[#f3f5f8]">{g.ket}</span>
                                    <Badge>{g.count}×</Badge>
                                </div>
                                <div className="text-lg font-black text-[#f5b301] mt-2">{rp(g.total)}</div>
                                <div className="text-[10px] text-[#7e8593] mt-1 mb-2">{pct.toFixed(0)}% dari total pengeluaran</div>
                                <div className="w-full h-1.5 bg-[#1b1d22] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#f5b301] rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Panel>

            {/* Form & Table */}
            <Panel
                title="Riwayat Catatan Biaya"
                subtitle="Daftar pengeluaran yang memotong saldo operasional (tercatat di database)"
            >
                {open && (
                    <div className="p-4 bg-[#0a0b0d] border border-[#26282f] rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Rekening Sumber</label>
                            <SelectInput
                                value={f.rek}
                                onChange={(e) => setF({ ...f, rek: e.target.value })}
                                options={bankOptions}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Kategori</label>
                            <SelectInput
                                value={f.category}
                                onChange={(e) => setF({ ...f, category: e.target.value })}
                                options={CATEGORIES}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Nominal Biaya (Rp) *</label>
                            <TextInput
                                type="number"
                                placeholder="cth: 6500"
                                value={f.biaya}
                                onChange={(e) => setF({ ...f, biaya: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Keterangan Pengeluaran</label>
                            <TextInput
                                placeholder="cth: Biaya transfer antar bank / Wifi"
                                value={f.ket}
                                onChange={(e) => setF({ ...f, ket: e.target.value })}
                            />
                        </div>
                        <div className="sm:col-span-4 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-3 py-2 text-xs font-semibold text-[#7e8593] hover:text-white"
                            >
                                Batal
                            </button>
                            <PrimaryBtn onClick={handleAdd} disabled={submitting}>
                                {submitting ? 'Menyimpan...' : 'Simpan ke Database'}
                            </PrimaryBtn>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#26282f] text-[#7e8593] font-bold uppercase tracking-wider">
                                <th className="p-3">Waktu (WIB)</th>
                                <th className="p-3">Kategori</th>
                                <th className="p-3">Rekening Sumber</th>
                                <th className="p-3 text-right">Biaya Keluar</th>
                                <th className="p-3">Keterangan</th>
                                <th className="p-3">Dicatat Oleh</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26282f]/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-[#7e8593]">
                                        Memuat data biaya operasional dari database...
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-[#7e8593]">
                                        Belum ada data biaya operasional di database.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((r) => {
                                    const d = new Date(r.createdAt)
                                    const dateStr = getJakartaDateString(d)
                                    const timeStr = getJakartaTimeString(d)
                                    return (
                                        <tr key={r.id} className="hover:bg-[#1b1d22]/40 transition-colors">
                                            <td className="p-3 text-[#d6dae1]">
                                                <div>{dateStr}</div>
                                                <div className="text-[10px] text-[#7e8593]">{timeStr} WIB</div>
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
                                                    {r.category}
                                                </span>
                                            </td>
                                            <td className="p-3 font-semibold text-[#f3f5f8]">
                                                <div className="flex items-center gap-1.5">
                                                    <Landmark size={13} strokeWidth={1.5} className="text-[#7e8593]" />
                                                    <span className="truncate max-w-[160px]">{r.bank_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-bold text-red-400 font-mono">
                                                − {rp(r.amount)}
                                            </td>
                                            <td className="p-3 text-[#d6dae1]">{r.description}</td>
                                            <td className="p-3">
                                                <Badge color="#f5b301">{r.user?.username || 'Admin'}</Badge>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(r.id)}
                                                    className="p-1.5 text-[#7e8593] hover:text-red-400 transition-colors cursor-pointer"
                                                    title="Hapus catatan"
                                                >
                                                    <Trash2 size={14} strokeWidth={1.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    )
}
