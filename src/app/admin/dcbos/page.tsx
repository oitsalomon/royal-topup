'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Crown, Coins, Landmark, Trash2, Database, Download, CheckCircle2 } from 'lucide-react'
import {
    PageHead, Panel, StatBig, Badge, PrimaryBtn,
    SelectInput, TextInput, RupiahInput
} from '@/components/admin/RoyalCloverUI'
import { rp, num, DEFAULT_OPS_BANKS } from '@/lib/clover-engine'
import { getJakartaDateString, getJakartaTimeString } from '@/lib/timezone'

interface DcBosRow {
    id: number
    amount: number
    type: string // 'uang' | 'chip'
    bank_name: string | null
    note: string | null
    createdAt: string
    user?: {
        id: number
        username: string
    }
}

export default function DcBosPage() {
    const [rows, setRows] = useState<DcBosRow[]>([])
    const [banks, setBanks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<'uang' | 'chip'>('uang')
    const [submitting, setSubmitting] = useState(false)

    // Local storage rescue
    const [localData, setLocalData] = useState<any[]>([])
    const [importingLocal, setImportingLocal] = useState(false)
    const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null)

    const [f, setF] = useState({
        rek: DEFAULT_OPS_BANKS[0]?.label || 'BCA',
        nominal: '',
        ket: ''
    })

    const fetchRows = async () => {
        try {
            const res = await fetch('/api/dcbos')
            if (res.ok) {
                const data = await res.json()
                setRows(data)
            }
        } catch (e) {
            console.error('Failed to fetch DC Bos:', e)
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
        fetchRows()
        fetchBanks()

        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('royal_ops_dcbos')
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
        const val = Number(f.nominal)
        if (!val || val <= 0) {
            alert('Nominal harus lebih dari 0')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/dcbos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: val,
                    type: mode,
                    bank_name: mode === 'uang' ? f.rek : 'ID Game Tampungan',
                    note: f.ket || (mode === 'uang' ? 'Setoran Bos' : 'Suntik Modal Chip')
                })
            })

            if (res.ok) {
                const newRow = await res.json()
                setRows(prev => [newRow, ...prev])
                setF(prev => ({ ...prev, nominal: '', ket: '' }))
                setOpen(false)
            } else {
                const err = await res.json().catch(() => ({}))
                alert(err.error || 'Gagal menyimpan transaksi DC Bos')
            }
        } catch (e) {
            console.error(e)
            alert('Terjadi kesalahan koneksi saat menyimpan')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus catatan DC Bos ini dari database?')) return

        try {
            const res = await fetch(`/api/dcbos?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setRows(prev => prev.filter(r => r.id !== id))
            } else {
                alert('Gagal menghapus catatan')
            }
        } catch (e) {
            console.error(e)
            alert('Terjadi kesalahan saat menghapus')
        }
    }

    // Export localStorage
    const handleExportLocalStorage = () => {
        if (!localData.length) return
        const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-dcbos-local-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Import localStorage to DB
    const handleImportLocalStorage = async () => {
        if (!localData.length) return
        if (!confirm(`Impor ${localData.length} data DC Bos dari browser lokal ke database server?`)) return

        setImportingLocal(true)
        let successCount = 0
        try {
            for (const item of localData) {
                const val = Number(item.keluar || item.masuk || item.amount || 0)
                if (val > 0) {
                    await fetch('/api/dcbos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: val,
                            type: item.jenis || 'uang',
                            bank_name: item.rek || null,
                            note: item.ket || 'Impor dari local storage'
                        })
                    })
                    successCount++
                }
            }
            localStorage.removeItem('royal_ops_dcbos')
            setLocalData([])
            setImportSuccessMsg(`Berhasil mengimpor ${successCount} data DC Bos ke database.`)
            await fetchRows()
        } catch (e) {
            console.error('Import error:', e)
            alert('Sebagian data gagal diimpor')
        } finally {
            setImportingLocal(false)
        }
    }

    const handleClearLocalStorage = () => {
        if (confirm('Hapus cache data lokal browser? Data di server tetap aman.')) {
            localStorage.removeItem('royal_ops_dcbos')
            setLocalData([])
        }
    }

    const totalUang = useMemo(() => rows.filter(r => r.type === 'uang').reduce((a, r) => a + r.amount, 0), [rows])
    const totalChip = useMemo(() => rows.filter(r => r.type === 'chip').reduce((a, r) => a + r.amount, 0), [rows])

    const bankOptions = banks.length > 0 ? banks.map(b => b.label) : DEFAULT_OPS_BANKS.map(b => b.label)

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Keuangan', 'DC Bos / Setoran']}
                title="DC Bos / Setoran"
                sub="Catatan mutasi penarikan modal atau setoran profit ke rekening bos (tercatat di database)"
                actions={
                    <PrimaryBtn onClick={() => setOpen(!open)}>
                        <Plus size={16} strokeWidth={1.5} /> Catat Setoran Baru
                    </PrimaryBtn>
                }
            />

            {/* LocalStorage Rescue Banner */}
            {localData.length > 0 && (
                <div className="p-4 bg-[#16181d] border border-[#f5b301]/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#f5b301]/10 border border-[#f5b301]/30 flex items-center justify-center text-[#f5b301] shrink-0">
                            <Database size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">
                                Ditemukan {localData.length} data catatan DC Bos lama di browser lokal ini
                            </div>
                            <div className="text-[11px] text-gray-400">
                                Anda dapat mengimpor data ini ke database PostgreSQL atau mengekspornya sebagai file JSON.
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
                <StatBig label="Total Setoran Uang" value={rp(totalUang)} sub={`${rows.filter(r => r.type === 'uang').length} mutasi uang`} />
                <StatBig label="Total Setoran Chip" value={`${num(totalChip)} B`} sub={`${rows.filter(r => r.type === 'chip').length} mutasi chip`} />
                <StatBig label="Total Rekap Setoran" value={`${rows.length} Mutasi`} sub="Tercatat di server" />
            </div>

            {/* Form */}
            <Panel title="Riwayat Setoran DC Bos" subtitle="Catatan aliran dana/chip ke owner">
                {open && (
                    <div className="p-4 bg-[#0a0b0d] border border-[#26282f] rounded-xl mb-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setMode('uang')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    mode === 'uang' ? 'bg-[#f5b301] text-black' : 'bg-white/5 text-gray-400'
                                }`}
                            >
                                Setoran Uang (Rp)
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('chip')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    mode === 'chip' ? 'bg-[#f5b301] text-black' : 'bg-white/5 text-gray-400'
                                }`}
                            >
                                Setoran Chip (B)
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {mode === 'uang' && (
                                <div>
                                    <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Rekening Bank Tujuan</label>
                                    <SelectInput
                                        value={f.rek}
                                        onChange={(e) => setF({ ...f, rek: e.target.value })}
                                        options={bankOptions}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">
                                    Nominal {mode === 'uang' ? '(Rp)' : '(B)'} *
                                </label>
                                {mode === 'uang' ? (
                                    <RupiahInput
                                        placeholder="cth: 3.000.000"
                                        value={f.nominal}
                                        onValueChange={(rawDigits) => setF({ ...f, nominal: rawDigits })}
                                    />
                                ) : (
                                    <TextInput
                                        type="number"
                                        step="any"
                                        placeholder="cth: 50"
                                        value={f.nominal}
                                        onChange={(e) => setF({ ...f, nominal: e.target.value })}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Keterangan</label>
                                <TextInput
                                    placeholder="cth: Setoran harian profit bos"
                                    value={f.ket}
                                    onChange={(e) => setF({ ...f, ket: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-3 py-2 text-xs font-semibold text-[#7e8593] hover:text-white"
                            >
                                Batal
                            </button>
                            <PrimaryBtn onClick={handleAdd} disabled={submitting}>
                                {submitting ? 'Menyimpan...' : 'Simpan Setoran'}
                            </PrimaryBtn>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#26282f] text-[#7e8593] font-bold uppercase tracking-wider">
                                <th className="p-3">Waktu (WIB)</th>
                                <th className="p-3">Jenis</th>
                                <th className="p-3">Rekening / Target</th>
                                <th className="p-3 text-right">Nominal</th>
                                <th className="p-3">Keterangan</th>
                                <th className="p-3">Dicatat Oleh</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26282f]/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-[#7e8593]">
                                        Memuat data DC Bos dari database...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-[#7e8593]">
                                        Belum ada data setoran DC Bos di database.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => {
                                    const d = new Date(r.createdAt)
                                    const dateStr = getJakartaDateString(d)
                                    const timeStr = getJakartaTimeString(d)
                                    const isUang = r.type === 'uang'
                                    return (
                                        <tr key={r.id} className="hover:bg-[#1b1d22]/40 transition-colors">
                                            <td className="p-3 text-[#d6dae1]">
                                                <div>{dateStr}</div>
                                                <div className="text-[10px] text-[#7e8593]">{timeStr} WIB</div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                    isUang ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#f5b301]/10 text-[#f5b301] border border-[#f5b301]/30'
                                                }`}>
                                                    {isUang ? 'UANG' : 'CHIP'}
                                                </span>
                                            </td>
                                            <td className="p-3 font-semibold text-[#f3f5f8]">
                                                <div className="flex items-center gap-1.5">
                                                    {isUang ? <Landmark size={13} strokeWidth={1.5} className="text-[#7e8593]" /> : <Coins size={13} strokeWidth={1.5} className="text-[#f5b301]" />}
                                                    <span className="truncate max-w-[160px]">{r.bank_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-black font-mono text-[#f3f5f8]">
                                                {isUang ? rp(r.amount) : `${num(r.amount)} B`}
                                            </td>
                                            <td className="p-3 text-[#d6dae1]">{r.note || '-'}</td>
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
