'use client'

import React, { useState, useMemo } from 'react'
import {
    ScrollText, Search, ShieldCheck, ArrowDownToLine, ArrowUpFromLine,
    ArrowLeftRight, Receipt, Crown, SlidersHorizontal
} from 'lucide-react'
import {
    PageHead, Panel, StatBig, Segment, Badge, TextInput,
    BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import { rp, num } from '@/lib/clover-engine'

interface LedgerEntry {
    id: number | string
    tgl: string
    jam: string
    jenis: 'top' | 'wd' | 'transfer' | 'biaya' | 'adjustment' | 'dcbos'
    label: string
    ref?: string
    cs: string
    masuk: number
    keluar: number
    chipIn?: number
    chipOut?: number
    saldoCash?: number
}

const SEED_LEDGER: LedgerEntry[] = [
    { id: 1, tgl: '2026-06-02', jam: '21:00', jenis: 'dcbos', label: 'Setoran bos harian', ref: 'BCA VERGA GUNAWAN', cs: 'Veer', masuk: 0, keluar: 3000000, saldoCash: 16848046 },
    { id: 2, tgl: '2026-06-02', jam: '20:05', jenis: 'transfer', label: 'Transfer QRIS Toko ke SeaBank', ref: 'internal', cs: 'Rapi', masuk: 500000, keluar: 500000, saldoCash: 19848046 },
    { id: 3, tgl: '2026-06-02', jam: '19:41', jenis: 'top', label: 'Top Up member andi (98112233)', ref: 'BCA VERGA GUNAWAN', cs: 'Rapi', masuk: 285000, keluar: 0, chipOut: 4.38, saldoCash: 19848046 },
    { id: 4, tgl: '2026-06-02', jam: '19:29', jenis: 'top', label: 'Top Up member rian (14386243)', ref: 'DANA LU FAN', cs: 'Rapi', masuk: 40000, keluar: 0, chipOut: 0.6, saldoCash: 19563046 },
    { id: 5, tgl: '2026-06-02', jam: '19:24', jenis: 'top', label: 'Top Up member rizky (15166432)', ref: 'DANA LU FAN', cs: 'Hioza', masuk: 195000, keluar: 0, chipOut: 3.0, saldoCash: 19523046 },
    { id: 6, tgl: '2026-06-02', jam: '19:21', jenis: 'top', label: 'Top Up member bayonet (1364328)', ref: 'QRIS DANA TOKO SEJAHTERA', cs: 'Hioza', masuk: 50000, keluar: 0, chipOut: 0.75, saldoCash: 19328046 },
    { id: 7, tgl: '2026-06-02', jam: '19:10', jenis: 'wd', label: 'WD member Budi S. (44120098)', ref: 'BCA VERGA GUNAWAN', cs: 'Rapi', masuk: 0, keluar: 150000, chipIn: 2.5, saldoCash: 19278046 },
    { id: 8, tgl: '2026-06-02', jam: '18:55', jenis: 'wd', label: 'WD member Dewi Lestari (77231144)', ref: 'BCA TAMBI', cs: 'Hioza', masuk: 0, keluar: 300000, chipIn: 5.0, saldoCash: 19428046 },
    { id: 9, tgl: '2026-06-02', jam: '18:05', jenis: 'biaya', label: 'Biaya admin transfer', ref: 'BCA VERGA GUNAWAN', cs: 'Rapi', masuk: 0, keluar: 6500, saldoCash: 19728046 },
    { id: 10, tgl: '2026-06-02', jam: '16:40', jenis: 'adjustment', label: 'Transfer lebih ke rekening member', ref: 'BCA TAMBI', cs: 'Hioza', masuk: 0, keluar: 50000, saldoCash: 19734546 },
]

export default function RekapArusPage() {
    const [jenis, setJenis] = useState<string>('all')
    const [q, setQ] = useState<string>('')
    const [csAccess, setCsAccess] = useState<boolean>(false)

    const jenisColor: Record<string, string> = {
        top: '#34d399',
        wd: '#f87171',
        transfer: '#60a5fa',
        biaya: '#f59e0b',
        adjustment: '#c084fc',
        dcbos: '#f5b301',
    }

    const jenisLabel: Record<string, string> = {
        top: 'TOP UP',
        wd: 'WD',
        transfer: 'TRANSFER',
        biaya: 'BIAYA',
        adjustment: 'ADJ',
        dcbos: 'DC BOS',
    }

    const filtered = useMemo(() => {
        return SEED_LEDGER.filter((e) => {
            const matchesJenis = jenis === 'all' || e.jenis === jenis
            const matchesQuery = [e.label, e.cs, e.ref, e.jenis].join(' ').toLowerCase().includes(q.toLowerCase())
            return matchesJenis && matchesQuery
        })
    }, [jenis, q])

    const totalMasuk = filtered.reduce((a, e) => a + (e.masuk || 0), 0)
    const totalKeluar = filtered.reduce((a, e) => a + (e.keluar || 0), 0)
    const netArus = totalMasuk - totalKeluar

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Keuangan', 'Rekap Arus']}
                title="Rekap Arus Kas & Chip"
                sub="Aliran rekonsiliasi kas terpadu — uang masuk, keluar, mutasi bank, dan chip dalam satu buku besar"
            />

            {/* Access control banner */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f5b301]/10 border border-[#f5b301]/25 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck size={16} className="text-[#f5b301]" />
                    <span className="font-bold text-[#f5b301]">Proteksi Rekap:</span>
                    <span className="text-[#d6dae1]">Halaman rekap buku besar ini diproteksi untuk akses Master/Salomon.</span>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-[#d6dae1] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={csAccess}
                        onChange={(e) => setCsAccess(e.target.checked)}
                        className="rounded border-[#26282f] bg-[#0a0b0d] text-[#f5b301] focus:ring-0"
                    />
                    Beri izin CS untuk melihat rekap
                </label>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBig label="Total Uang Masuk" value={rp(totalMasuk)} sub={`${filtered.length} transaksi`} delta="+14.2% vs prev" deltaUp={true} />
                <StatBig label="Total Uang Keluar" value={rp(totalKeluar)} sub="WD + Biaya + Setoran" delta="-3.1% vs prev" deltaUp={false} />
                <StatBig
                    label="Selisih Arus (Net)"
                    value={rp(netArus)}
                    sub={netArus >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
                    delta={netArus >= 0 ? 'Surplus' : 'Defisit'}
                    deltaUp={netArus >= 0}
                />
            </div>

            {/* Ledger Panel */}
            <Panel
                title="Buku Besar Arus Transaksi"
                subtitle="Kronologis dari yang terbaru · saldo berjalan tiap baris"
                action={
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-[#7e8593]" />
                        <TextInput
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari keterangan / CS / rek"
                            style={{ paddingLeft: '28px', width: '220px', fontSize: '12px' }}
                        />
                    </div>
                }
            >
                {/* Filter jenis tabs */}
                <div className="mb-4 overflow-x-auto pb-1">
                    <Segment
                        options={[
                            { key: 'all', label: 'Semua' },
                            { key: 'top', label: 'Top Up' },
                            { key: 'wd', label: 'WD' },
                            { key: 'transfer', label: 'Transfer' },
                            { key: 'biaya', label: 'Biaya' },
                            { key: 'adjustment', label: 'Adjustment' },
                            { key: 'dcbos', label: 'DC Bos' },
                        ]}
                        value={jenis}
                        onChange={setJenis}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#26282f] text-[#7e8593] font-bold uppercase tracking-wider">
                                <th className="p-3">Waktu</th>
                                <th className="p-3">Jenis</th>
                                <th className="p-3">Keterangan & Rekening</th>
                                <th className="p-3">Oleh</th>
                                <th className="p-3 text-right">Uang Masuk</th>
                                <th className="p-3 text-right">Uang Keluar</th>
                                <th className="p-3 text-right">Mutasi Chip</th>
                                <th className="p-3 text-right">Saldo Kas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26282f]/60">
                            {filtered.map((e) => (
                                <tr key={e.id} className="hover:bg-[#1b1d22]/40 transition-colors">
                                    <td className="p-3 text-[#d6dae1]">
                                        <div>{e.tgl}</div>
                                        <div className="text-[10px] text-[#7e8593]">{e.jam}</div>
                                    </td>
                                    <td className="p-3">
                                        <Badge color={jenisColor[e.jenis] || '#f5b301'}>
                                            {jenisLabel[e.jenis] || e.jenis.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="p-3 font-semibold text-[#f3f5f8]">
                                        <div>{e.label}</div>
                                        {e.ref && e.ref !== 'internal' && (
                                            <div className="text-[10px] text-[#7e8593]">{e.ref}</div>
                                        )}
                                    </td>
                                    <td className="p-3 font-medium text-[#f5b301]">{e.cs}</td>
                                    <td className="p-3 text-right font-bold text-emerald-400">
                                        {e.masuk ? `+${rp(e.masuk)}` : '—'}
                                    </td>
                                    <td className="p-3 text-right font-bold text-red-400">
                                        {e.keluar ? `−${rp(e.keluar)}` : '—'}
                                    </td>
                                    <td className="p-3 text-right font-semibold">
                                        {e.chipIn ? (
                                            <span className="text-emerald-400">+{num(e.chipIn)} B</span>
                                        ) : e.chipOut ? (
                                            <span className="text-[#f5b301]">−{num(e.chipOut)} B</span>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="p-3 text-right font-bold text-[#f3f5f8]">
                                        {e.saldoCash ? rp(e.saldoCash) : '—'}
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
