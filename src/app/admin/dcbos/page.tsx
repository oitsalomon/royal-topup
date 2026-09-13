'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Crown, Coins, Landmark, Trash2 } from 'lucide-react'
import {
    PageHead, Panel, StatBig, Badge, PrimaryBtn,
    SelectInput, TextInput, BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import { rp, num, DEFAULT_OPS_BANKS } from '@/lib/clover-engine'

interface DcBosItem {
    id: number | string
    tgl: string
    jam: string
    jenis: 'uang' | 'chip'
    rek?: string
    idAkun?: string
    masuk: number
    keluar: number
    ket: string
    cs: string
}

const SEED_DCBOS: DcBosItem[] = [
    { id: 1, tgl: '2026-06-02', jam: '21:00', jenis: 'uang', rek: 'BCA VERGA GUNAWAN', masuk: 0, keluar: 3000000, ket: 'Setoran bos harian', cs: 'Veer' },
    { id: 2, tgl: '2026-06-01', jam: '22:15', jenis: 'chip', idAkun: 'CLOVER', masuk: 50, keluar: 0, ket: 'Bos suntik chip modal', cs: 'Veer' },
]

export default function DcBosPage() {
    const [rows, setRows] = useState<DcBosItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('royal_ops_dcbos')
            if (saved) {
                try { return JSON.parse(saved) } catch (_) {}
            }
        }
        return SEED_DCBOS
    })

    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<'uang' | 'chip'>('uang')
    const [f, setF] = useState({
        rek: DEFAULT_OPS_BANKS[0].label,
        idAkun: 'CLOVER',
        masuk: '',
        keluar: '',
        ket: ''
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('royal_ops_dcbos', JSON.stringify(rows))
        }
    }, [rows])

    const handleAdd = () => {
        const m = Number(f.masuk || 0)
        const k = Number(f.keluar || 0)
        if (!m && !k) return

        const now = new Date()
        const newItem: DcBosItem = {
            id: Date.now(),
            tgl: now.toISOString().slice(0, 10),
            jam: now.toTimeString().slice(0, 5),
            jenis: mode,
            rek: mode === 'uang' ? f.rek : undefined,
            idAkun: mode === 'chip' ? f.idAkun : undefined,
            masuk: m,
            keluar: k,
            ket: f.ket || (k > 0 ? 'Setoran / Tarik Bos' : 'Suntik Modal Bos'),
            cs: 'Salomon'
        }

        setRows([newItem, ...rows])
        setF({ rek: DEFAULT_OPS_BANKS[0].label, idAkun: 'CLOVER', masuk: '', keluar: '', ket: '' })
        setOpen(false)
    }

    const handleDelete = (id: number | string) => {
        if (confirm('Hapus transaksi DC Bos ini?')) {
            setRows(rows.filter((r) => r.id !== id))
        }
    }

    const totalSetorUang = rows
        .filter((r) => r.jenis === 'uang')
        .reduce((a, r) => a + r.keluar, 0)

    const totalMasukUang = rows
        .filter((r) => r.jenis === 'uang')
        .reduce((a, r) => a + r.masuk, 0)

    const totalSetorChip = rows
        .filter((r) => r.jenis === 'chip')
        .reduce((a, r) => a + r.keluar, 0)

    const totalMasukChip = rows
        .filter((r) => r.jenis === 'chip')
        .reduce((a, r) => a + r.masuk, 0)

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Keuangan', 'DC Bos']}
                title="DC Bos — Setoran & Distribusi"
                sub="Pencatatan uang & chip yang disetor ke bos atau disuntikkan sebagai modal"
                actions={
                    <PrimaryBtn onClick={() => setOpen(!open)}>
                        <Plus size={16} /> Catat Mutasi Bos
                    </PrimaryBtn>
                }
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBig label="Total Tarik/Setor Bos (Uang)" value={rp(totalSetorUang)} sub="Uang ditarik ke rekening bos" />
                <StatBig label="Suntik Modal Bos (Uang)" value={rp(totalMasukUang)} sub="Uang modal masuk dari bos" />
                <StatBig label="Tarik Chip ke Bos" value={`${num(totalSetorChip)} B`} sub="Chip ditarik bos" />
                <StatBig label="Suntik Chip dari Bos" value={`${num(totalMasukChip)} B`} sub="Chip tambahan dari bos" />
            </div>

            {/* Main Panel */}
            <Panel
                title="Riwayat Mutasi DC Bos"
                subtitle="Semua pencatatan setor/tarik bos"
            >
                {open && (
                    <div className="p-4 bg-[#0a0b0d] border border-[#26282f] rounded-xl mb-4 space-y-4">
                        {/* Selector Jenis Uang / Chip */}
                        <div className="inline-flex gap-2 p-1 bg-[#131417] border border-[#26282f] rounded-lg">
                            <button
                                type="button"
                                onClick={() => setMode('uang')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    mode === 'uang' ? 'bg-[#f5b301] text-[#1a1500]' : 'text-[#7e8593] hover:text-white'
                                }`}
                            >
                                UANG (RUPIAH)
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('chip')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    mode === 'chip' ? 'bg-[#f5b301] text-[#1a1500]' : 'text-[#7e8593] hover:text-white'
                                }`}
                            >
                                CHIP
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">
                                    {mode === 'uang' ? 'Rekening Bank' : 'ID Akun Chip'}
                                </label>
                                {mode === 'uang' ? (
                                    <SelectInput
                                        value={f.rek}
                                        onChange={(e) => setF({ ...f, rek: e.target.value })}
                                        options={DEFAULT_OPS_BANKS.map((b) => b.label)}
                                    />
                                ) : (
                                    <SelectInput
                                        value={f.idAkun}
                                        onChange={(e) => setF({ ...f, idAkun: e.target.value })}
                                        options={['CLOVER']}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">
                                    {mode === 'uang' ? 'Masuk Rp (+)' : 'Chip Masuk (+)'}
                                </label>
                                <TextInput
                                    type="number"
                                    placeholder="0"
                                    value={f.masuk}
                                    onChange={(e) => setF({ ...f, masuk: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">
                                    {mode === 'uang' ? 'Keluar / Disetor Rp (-)' : 'Chip Keluar (-)'}
                                </label>
                                <TextInput
                                    type="number"
                                    placeholder="0"
                                    value={f.keluar}
                                    onChange={(e) => setF({ ...f, keluar: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Keterangan</label>
                                <TextInput
                                    placeholder="cth: Setoran harian"
                                    value={f.ket}
                                    onChange={(e) => setF({ ...f, ket: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-3 py-2 text-xs font-semibold text-[#7e8593] hover:text-white"
                            >
                                Batal
                            </button>
                            <PrimaryBtn onClick={handleAdd}>Simpan Mutasi Bos</PrimaryBtn>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#26282f] text-[#7e8593] font-bold uppercase tracking-wider">
                                <th className="p-3">Waktu</th>
                                <th className="p-3">Jenis</th>
                                <th className="p-3">Target (Rek / ID)</th>
                                <th className="p-3 text-right">Masuk (+)</th>
                                <th className="p-3 text-right">Keluar (-)</th>
                                <th className="p-3">Keterangan</th>
                                <th className="p-3">Oleh</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26282f]/60">
                            {rows.map((r) => {
                                const isChip = r.jenis === 'chip'
                                return (
                                    <tr key={r.id} className="hover:bg-[#1b1d22]/40 transition-colors">
                                        <td className="p-3 text-[#d6dae1]">
                                            <div>{r.tgl}</div>
                                            <div className="text-[10px] text-[#7e8593]">{r.jam}</div>
                                        </td>
                                        <td className="p-3">
                                            <Badge color={isChip ? '#f5b301' : '#60a5fa'}>
                                                {isChip ? 'CHIP' : 'UANG'}
                                            </Badge>
                                        </td>
                                        <td className="p-3 font-semibold text-[#f3f5f8]">
                                            {r.rek || r.idAkun || '—'}
                                        </td>
                                        <td className="p-3 text-right font-bold text-emerald-400">
                                            {r.masuk ? (isChip ? `+${num(r.masuk)} B` : `+${rp(r.masuk)}`) : '—'}
                                        </td>
                                        <td className="p-3 text-right font-bold text-red-400">
                                            {r.keluar ? (isChip ? `−${num(r.keluar)} B` : `−${rp(r.keluar)}`) : '—'}
                                        </td>
                                        <td className="p-3 text-[#d6dae1]">{r.ket}</td>
                                        <td className="p-3 text-[#f5b301] font-semibold">{r.cs}</td>
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
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    )
}
