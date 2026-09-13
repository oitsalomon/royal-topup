'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Receipt, Landmark, Trash2, CheckCircle2 } from 'lucide-react'
import {
    PageHead, Panel, StatBig, Badge, PrimaryBtn,
    SelectInput, TextInput, BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import { rp, DEFAULT_OPS_BANKS } from '@/lib/clover-engine'

interface BiayaItem {
    id: number | string
    tgl: string
    jam: string
    rek: string
    biaya: number
    ket: string
    admin: string
}

const SEED_BIAYA: BiayaItem[] = [
    { id: 1, tgl: '2026-06-02', jam: '12:00', rek: 'BCA TAMBI', biaya: 6500, ket: 'Biaya admin transfer', admin: 'Veer' },
    { id: 2, tgl: '2026-06-02', jam: '16:20', rek: 'DANA LU FAN', biaya: 1000, ket: 'Top up pulsa CS', admin: 'Hioza' },
    { id: 3, tgl: '2026-06-02', jam: '18:05', rek: 'BCA VERGA GUNAWAN', biaya: 6500, ket: 'Biaya admin transfer', admin: 'Rapi' },
    { id: 4, tgl: '2026-06-01', jam: '09:30', rek: 'MANDIRI VERGA GUNAWAN', biaya: 2500, ket: 'Biaya admin transfer', admin: 'Veer' },
    { id: 5, tgl: '2026-06-01', jam: '14:50', rek: 'BCA TAMBI', biaya: 50000, ket: 'Bayar internet kantor', admin: 'Veer' },
    { id: 6, tgl: '2026-05-31', jam: '20:10', rek: 'DANA LU FAN', biaya: 1000, ket: 'Top up pulsa CS', admin: 'Hioza' },
]

export default function BiayaPage() {
    const [rows, setRows] = useState<BiayaItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('royal_ops_biaya')
            if (saved) {
                try { return JSON.parse(saved) } catch (_) {}
            }
        }
        return SEED_BIAYA
    })

    const [open, setOpen] = useState(false)
    const [filterPeriod, setFilterPeriod] = useState('all')
    const [f, setF] = useState({
        rek: DEFAULT_OPS_BANKS[0].label,
        biaya: '',
        ket: ''
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('royal_ops_biaya', JSON.stringify(rows))
        }
    }, [rows])

    const handleAdd = () => {
        if (!f.biaya || Number(f.biaya) <= 0) return
        const now = new Date()
        const newItem: BiayaItem = {
            id: Date.now(),
            tgl: now.toISOString().slice(0, 10),
            jam: now.toTimeString().slice(0, 5),
            rek: f.rek,
            biaya: Number(f.biaya),
            ket: f.ket || 'Tanpa keterangan',
            admin: 'Salomon'
        }
        setRows([newItem, ...rows])
        setF({ rek: DEFAULT_OPS_BANKS[0].label, biaya: '', ket: '' })
        setOpen(false)
    }

    const handleDelete = (id: number | string) => {
        if (confirm('Hapus catatan biaya ini?')) {
            setRows(rows.filter((r) => r.id !== id))
        }
    }

    const grandTotal = useMemo(() => rows.reduce((a, r) => a + r.biaya, 0), [rows])

    const summary = useMemo(() => {
        const m: Record<string, { ket: string; total: number; count: number }> = {}
        rows.forEach((r) => {
            const key = (r.ket || 'Lainnya').trim().toLowerCase()
            if (!m[key]) m[key] = { ket: (r.ket || 'Lainnya').trim(), total: 0, count: 0 }
            m[key].total += r.biaya
            m[key].count++
        })
        return Object.values(m).sort((a, b) => b.total - a.total)
    }, [rows])

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Keuangan', 'Biaya Operasional']}
                title="Biaya Operasional"
                sub="Catatan pengeluaran kantor, pulsa CS, dan biaya admin transfer bank"
                actions={
                    <PrimaryBtn onClick={() => setOpen(!open)}>
                        <Plus size={16} /> Catat Biaya Baru
                    </PrimaryBtn>
                }
            />

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBig label="Total Pengeluaran" value={rp(grandTotal)} sub={`${rows.length} pengeluaran tercatat`} />
                <StatBig label="Rata-rata per Transaksi" value={rp(rows.length ? grandTotal / rows.length : 0)} sub="Biaya per mutasi" />
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
                subtitle="Daftar pengeluaran yang memotong saldo rekening"
            >
                {open && (
                    <div className="p-4 bg-[#0a0b0d] border border-[#26282f] rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Rekening Sumber</label>
                            <SelectInput
                                value={f.rek}
                                onChange={(e) => setF({ ...f, rek: e.target.value })}
                                options={DEFAULT_OPS_BANKS.map((b) => b.label)}
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
                                placeholder="cth: Admin transfer / Wifi"
                                value={f.ket}
                                onChange={(e) => setF({ ...f, ket: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <PrimaryBtn onClick={handleAdd}>Simpan Biaya</PrimaryBtn>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-3 py-2 text-xs font-semibold text-[#7e8593] hover:text-white"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#26282f] text-[#7e8593] font-bold uppercase tracking-wider">
                                <th className="p-3">Waktu</th>
                                <th className="p-3">Rekening Bank</th>
                                <th className="p-3 text-right">Biaya Keluar</th>
                                <th className="p-3">Keterangan</th>
                                <th className="p-3">Admin</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26282f]/60">
                            {rows.map((r) => (
                                <tr key={r.id} className="hover:bg-[#1b1d22]/40 transition-colors">
                                    <td className="p-3 text-[#d6dae1]">
                                        <div>{r.tgl}</div>
                                        <div className="text-[10px] text-[#7e8593]">{r.jam}</div>
                                    </td>
                                    <td className="p-3 font-semibold text-[#f3f5f8] flex items-center gap-1.5 mt-1.5">
                                        <Landmark size={13} className="text-[#7e8593]" />
                                        {r.rek}
                                    </td>
                                    <td className="p-3 text-right font-bold text-red-400">− {rp(r.biaya)}</td>
                                    <td className="p-3 text-[#d6dae1]">{r.ket}</td>
                                    <td className="p-3">
                                        <Badge color="#f5b301">{r.admin}</Badge>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(r.id)}
                                            className="p-1.5 text-[#7e8593] hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    )
}
