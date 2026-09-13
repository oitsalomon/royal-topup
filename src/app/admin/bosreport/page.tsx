'use client'

import React, { useState, useMemo } from 'react'
import { ShieldCheck, Landmark, Coins, TrendingUp, DollarSign, Wallet } from 'lucide-react'
import {
    PageHead, Panel, StatBig, TextInput,
    BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import { rp, num, DEFAULT_OPS_BANKS, DEFAULT_OPS_IDS } from '@/lib/clover-engine'

export default function BosReportPage() {
    const [hargaModal, setHargaModal] = useState<number>(60000)
    const [banks, setBanks] = useState(DEFAULT_OPS_BANKS)
    const [chipIds, setChipIds] = useState(DEFAULT_OPS_IDS)

    // Financial calculations
    const omzetTop = 18450000
    const chipJual = 284.5
    const hargaJualAvg = chipJual ? omzetTop / chipJual : 0

    const wdBayar = 9850000
    const chipBalik = 164.0
    const wdBiayaTransfer = 24000
    const hargaBeliAvg = chipBalik ? wdBayar / chipBalik : 0

    const grossMargin = chipJual * (hargaJualAvg - hargaModal)

    const totalBiayaOperasional = 67500
    const totalGajiStaff = 5000000 // Hioza 2.5jt + Rapi 2.5jt
    const rugiAdj = 30000
    const dcBosKeluar = 3000000
    const totalPengeluaran = totalBiayaOperasional + totalGajiStaff + rugiAdj

    const untungBersih = grossMargin - totalPengeluaran - wdBiayaTransfer

    const totalBankNow = banks.reduce((a, b) => a + b.saldo, 0)
    const totalChipNow = chipIds.reduce((a, c) => a + c.chipAwal, 0)
    const nilaiChipNow = totalChipNow * hargaModal
    const totalAsetNow = totalBankNow + nilaiChipNow

    const kasbonBelumLunas = 800000 // Hioza 500k + Rapi 300k

    const Row = ({
        label,
        value,
        color,
        bold,
        neg,
        indent
    }: {
        label: string
        value: number | string
        color?: string
        bold?: boolean
        neg?: boolean
        indent?: boolean
    }) => (
        <div
            className={`flex justify-between items-center py-2.5 border-b border-[#26282f] text-xs ${
                indent ? 'pl-4' : ''
            }`}
        >
            <span className={bold ? 'font-bold text-[#f3f5f8]' : 'text-[#d6dae1]'}>{label}</span>
            <span
                className={`font-bold ${
                    color || (bold ? 'text-[#f3f5f8] text-sm' : 'text-[#d6dae1]')
                }`}
            >
                {typeof value === 'number' ? (neg && value > 0 ? `− ${rp(value)}` : rp(value)) : value}
            </span>
        </div>
    )

    return (
        <div className="space-y-6">
            <PageHead
                crumbs={['Privat', 'Laporan Bos']}
                title="Laporan Eksekutif Bos"
                sub="Untung-rugi komprehensif, valuasi aset, pengeluaran kantor, dan estimasi margin bersih"
            />

            {/* Privacy Alert */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5b301]/10 border border-[#f5b301]/25 text-xs">
                <ShieldCheck size={17} className="text-[#f5b301]" />
                <span className="font-bold text-[#f5b301]">Rahasia — Khusus Master:</span>
                <span className="text-[#d6dae1]">Halaman ini hanya dapat diakses oleh akun Salomon (Owner). Staff CS tidak memiliki akses.</span>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBig label="Total Valuasi Aset" value={rp(totalAsetNow)} sub="Bank + Nilai Stok Chip" big />
                <StatBig label="Untung Bersih (Net)" value={rp(untungBersih)} sub="Setelah gaji & biaya" delta="+22% margin" deltaUp={untungBersih > 0} big />
                <StatBig label="Gross Margin Topup" value={rp(grossMargin)} sub={`Rata-rata jual: ${rp(hargaJualAvg)}/B`} />
                <StatBig label="Kasbon CS Belum Lunas" value={rp(kasbonBelumLunas)} sub="Staff Hioza & Rapi" />
            </div>

            {/* Modal & Setup Saldo Awal */}
            <Panel
                title="Konfigurasi Modal & Saldo Awal"
                subtitle="Saldo awal rekening & chip modal awal yang mendasari perhitungan"
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="p-3 bg-[#0a0b0d] border border-[#26282f] rounded-xl">
                        <label className="text-[11px] font-bold text-[#f5b301] block mb-1">Harga Modal Chip (Rp)</label>
                        <TextInput
                            type="number"
                            value={hargaModal}
                            onChange={(e) => setHargaModal(Number(e.target.value) || 0)}
                        />
                        <div className="text-[10px] text-[#7e8593] mt-1.5">Acuan beli/modal per 1B</div>
                    </div>

                    {banks.slice(0, 4).map((b) => (
                        <div key={b.id} className="p-3 bg-[#0a0b0d] border border-[#26282f] rounded-xl">
                            <label className="text-[11px] font-semibold text-[#d6dae1] block mb-1 truncate flex items-center gap-1">
                                <Landmark size={12} className="text-[#7e8593]" />
                                {b.label}
                            </label>
                            <TextInput
                                type="number"
                                value={b.saldo}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0
                                    setBanks(banks.map((x) => (x.id === b.id ? { ...x, saldo: val } : x)))
                                }}
                            />
                            <div className="text-[10px] text-[#7e8593] mt-1.5">Saldo awal bank</div>
                        </div>
                    ))}
                </div>
            </Panel>

            {/* Rincian Finansial Laba Rugi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Panel title="Pemasukan & Penjualan Chip" subtitle="Kinerja omzet penjualan dan beli balik (WD)">
                    <div className="space-y-1">
                        <Row label="Total Omzet Top Up" value={omzetTop} bold color="text-emerald-400" />
                        <Row label="Total Chip Terkirim" value={`${num(chipJual)} B`} indent />
                        <Row label="Rata-rata Harga Jual per 1B" value={rp(hargaJualAvg)} indent />
                        <Row label="Harga Modal per 1B" value={rp(hargaModal)} indent />
                        <Row label="Gross Margin (Selisih Penjualan)" value={grossMargin} bold color="text-[#f5b301]" />

                        <div className="pt-3" />
                        <Row label="Total Uang Keluar WD" value={wdBayar} bold color="text-red-400" />
                        <Row label="Chip Diterima dari WD" value={`${num(chipBalik)} B`} indent />
                        <Row label="Rata-rata Harga Buyback WD" value={rp(hargaBeliAvg)} indent />
                        <Row label="Biaya Transfer Bank saat WD" value={wdBiayaTransfer} indent neg color="text-red-400" />
                    </div>
                </Panel>

                <Panel title="Biaya Operasional & Beban Kas" subtitle="Pengeluaran operasional, gaji, dan setoran">
                    <div className="space-y-1">
                        <Row label="Beban Gaji Staff CS" value={totalGajiStaff} bold neg color="text-red-400" />
                        <Row label="Gaji Pokok Hioza" value={2500000} indent />
                        <Row label="Gaji Pokok Rapi" value={2500000} indent />
                        <Row label="Biaya Operasional Kantor / CS" value={totalBiayaOperasional} neg color="text-red-400" />
                        <Row label="Rugi Salah Kirim (Adjustment)" value={rugiAdj} neg color="text-red-400" />

                        <div className="pt-3 border-t border-[#26282f]" />
                        <Row label="Total Beban Operasional" value={totalPengeluaran} bold color="text-red-400" />
                        <Row label="Laba Bersih Operasional (EBITDA)" value={untungBersih} bold color="text-emerald-400" />

                        <div className="pt-3" />
                        <Row label="Setoran Bos Terlaksana (DC Bos)" value={dcBosKeluar} color="text-[#f5b301]" />
                    </div>
                </Panel>
            </div>
        </div>
    )
}
