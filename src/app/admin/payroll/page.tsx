'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Plus, User, Wallet, CheckCircle2, Clock } from 'lucide-react'
import {
    PageHead, Panel, StatBig, Badge, PrimaryBtn,
    SelectInput, TextInput, BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import { rp } from '@/lib/clover-engine'

interface StaffItem {
    id: string
    nama: string
    gajiPokok: number
}

interface KasbonItem {
    id: number | string
    tgl: string
    cs: string
    jumlah: number
    ket: string
    lunas: boolean
}

const SEED_STAFF: StaffItem[] = [
    { id: 'hioza', nama: 'Hioza', gajiPokok: 2500000 },
    { id: 'rapi', nama: 'Rapi', gajiPokok: 2500000 },
]

const SEED_KASBON: KasbonItem[] = [
    { id: 1, tgl: '2026-06-01', cs: 'Hioza', jumlah: 500000, ket: 'Kasbon awal bulan', lunas: false },
    { id: 2, tgl: '2026-05-20', cs: 'Rapi', jumlah: 300000, ket: 'Pinjaman darurat', lunas: false },
    { id: 3, tgl: '2026-05-10', cs: 'Hioza', jumlah: 200000, ket: 'Kasbon', lunas: true },
]

export default function PayrollPage() {
    const [staff] = useState<StaffItem[]>(SEED_STAFF)
    const [kasbon, setKasbon] = useState<KasbonItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('royal_ops_kasbon')
            if (saved) {
                try { return JSON.parse(saved) } catch (_) {}
            }
        }
        return SEED_KASBON
    })

    const [open, setOpen] = useState(false)
    const [f, setF] = useState({
        cs: SEED_STAFF[0].nama,
        jumlah: '',
        ket: ''
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('royal_ops_kasbon', JSON.stringify(kasbon))
        }
    }, [kasbon])

    const handleAdd = () => {
        if (!f.jumlah || Number(f.jumlah) <= 0) return
        const now = new Date()
        const newItem: KasbonItem = {
            id: Date.now(),
            tgl: now.toISOString().slice(0, 10),
            cs: f.cs,
            jumlah: Number(f.jumlah),
            ket: f.ket || 'Kasbon CS',
            lunas: false
        }
        setKasbon([newItem, ...kasbon])
        setF({ cs: SEED_STAFF[0].nama, jumlah: '', ket: '' })
        setOpen(false)
    }

    const toggleLunas = (id: number | string) => {
        setKasbon(kasbon.map((k) => (k.id === id ? { ...k, lunas: !k.lunas } : k)))
    }

    const totalKasbonAktif = kasbon
        .filter((k) => !k.lunas)
        .reduce((a, k) => a + k.jumlah, 0)

    const payrollSummary = staff.map((s) => {
        const pinjamanAktif = kasbon
            .filter((k) => k.cs === s.nama && !k.lunas)
            .reduce((a, k) => a + k.jumlah, 0)
        return {
            ...s,
            kasbonAktif: pinjamanAktif,
            gajiBersih: s.gajiPokok - pinjamanAktif
        }
    })

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Privat', 'Gaji & Kasbon']}
                title="Gaji Staff & Monitoring Kasbon"
                sub="Kalkulasi take-home pay CS (gaji pokok dipotong kasbon aktif) — khusus Master"
                actions={
                    <PrimaryBtn onClick={() => setOpen(!open)}>
                        <Plus size={16} /> Catat Kasbon Baru
                    </PrimaryBtn>
                }
            />

            {/* Privacy Alert */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5b301]/10 border border-[#f5b301]/25 text-xs">
                <ShieldCheck size={17} className="text-[#f5b301]" />
                <span className="font-bold text-[#f5b301]">Privat — Master:</span>
                <span className="text-[#d6dae1]">Halaman ini hanya dapat diakses oleh akun Salomon. Data gaji dan pinjaman staff dijaga kerahasiaannya.</span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBig label="Total Beban Gaji Pokok" value={rp(staff.reduce((a, s) => a + s.gajiPokok, 0))} sub={`${staff.length} Staff CS`} />
                <StatBig label="Total Kasbon Belum Lunas" value={rp(totalKasbonAktif)} sub="Menunggu pemotongan gaji" delta="Aktif" deltaUp={false} />
                <StatBig label="Estimasi Pembayaran Gaji Bersih" value={rp(payrollSummary.reduce((a, s) => a + s.gajiBersih, 0))} sub="Gaji Pokok − Kasbon" />
            </div>

            {/* Perhitungan Gaji per Staff */}
            <Panel title="Rincian Take Home Pay per CS" subtitle="Gaji bersih yang akan dibayarkan setelah potongan kasbon">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payrollSummary.map((s) => (
                        <div key={s.id} className="p-4 bg-[#0a0b0d] border border-[#26282f] rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#f5b301]/10 border border-[#f5b301]/20 flex items-center justify-center text-[#f5b301]">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-extrabold text-[#f3f5f8]">{s.nama}</div>
                                        <div className="text-xs text-[#7e8593]">Customer Service Shift</div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Aktif
                                </span>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-[#26282f] text-xs">
                                <div className="flex justify-between text-[#d6dae1]">
                                    <span>Gaji Pokok:</span>
                                    <span className="font-bold text-white">{rp(s.gajiPokok)}</span>
                                </div>
                                <div className="flex justify-between text-red-400">
                                    <span>Kasbon Belum Lunas:</span>
                                    <span className="font-bold">− {rp(s.kasbonAktif)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-[#26282f] text-sm">
                                    <span className="font-bold text-[#f3f5f8]">Gaji Bersih Diterima:</span>
                                    <span className="font-black text-[#f5b301]">{rp(s.gajiBersih)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>

            {/* Log Kasbon Table */}
            <Panel title="Riwayat Catatan Kasbon" subtitle="Daftar pinjaman staff CS dan status pelunasan">
                {open && (
                    <div className="p-4 bg-[#0a0b0d] border border-[#26282f] rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Pilih CS</label>
                            <SelectInput
                                value={f.cs}
                                onChange={(e) => setF({ ...f, cs: e.target.value })}
                                options={staff.map((s) => s.nama)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Jumlah Kasbon (Rp) *</label>
                            <TextInput
                                type="number"
                                placeholder="cth: 500000"
                                value={f.jumlah}
                                onChange={(e) => setF({ ...f, jumlah: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Keterangan Pinjaman</label>
                            <TextInput
                                placeholder="cth: Kasbon awal bulan"
                                value={f.ket}
                                onChange={(e) => setF({ ...f, ket: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <PrimaryBtn onClick={handleAdd}>Simpan Kasbon</PrimaryBtn>
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
                                <th className="p-3">Tanggal</th>
                                <th className="p-3">Nama CS</th>
                                <th className="p-3 text-right">Jumlah Pinjaman</th>
                                <th className="p-3">Keterangan</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26282f]/60">
                            {kasbon.map((k) => (
                                <tr key={k.id} className="hover:bg-[#1b1d22]/40 transition-colors">
                                    <td className="p-3 text-[#d6dae1]">{k.tgl}</td>
                                    <td className="p-3 font-semibold text-[#f3f5f8] flex items-center gap-1.5">
                                        <User size={13} className="text-[#f5b301]" />
                                        {k.cs}
                                    </td>
                                    <td className="p-3 text-right font-bold text-white">{rp(k.jumlah)}</td>
                                    <td className="p-3 text-[#d6dae1]">{k.ket}</td>
                                    <td className="p-3 text-center">
                                        <Badge color={k.lunas ? '#34d399' : '#f59e0b'}>
                                            {k.lunas ? 'LUNAS' : 'BELUM LUNAS'}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => toggleLunas(k.id)}
                                            className="px-2.5 py-1 rounded bg-[#1b1d22] border border-[#26282f] text-[11px] font-semibold text-[#d6dae1] hover:text-white hover:border-[#f5b301]/40 transition-colors"
                                        >
                                            {k.lunas ? 'Tandai Belum' : 'Tandai Lunas'}
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
