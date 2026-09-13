'use client'

import React, { useState, useEffect } from 'react'
import {
    ArrowUpCircle, ArrowDownCircle, Save, CheckCircle2,
    Calculator, Sparkles, AlertCircle
} from 'lucide-react'
import {
    PageHead, Panel, Badge, PrimaryBtn, SelectInput, TextInput,
    BG, PANEL, PANEL2, BORDER, MUTED, TEXT, TEXT2, TEXT3
} from '@/components/admin/RoyalCloverUI'
import {
    hitungChipTop, hitungNominalWd, hitungBiayaWd,
    rp, num
} from '@/lib/clover-engine'

interface Game {
    id: number
    name: string
    store_name?: string | null
}

interface Bank {
    id: number
    name: string
    account_number: string
    store_name?: string | null
}

export default function ManualTransactionPage() {
    const [type, setType] = useState<'TOPUP' | 'WITHDRAW'>('TOPUP')
    const [games, setGames] = useState<Game[]>([])
    const [banks, setBanks] = useState<Bank[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Rate override option for TOPUP
    const [specialRate, setSpecialRate] = useState<string>('')

    // Form Data
    const [formData, setFormData] = useState({
        user_wa: '',
        nickname: '',
        game_id: '',
        user_game_id: '',
        amount_chip: '',
        amount_money: '',
        payment_method_id: '',
        note: ''
    })

    useEffect(() => {
        const init = async () => {
            try {
                const [gRes, bRes] = await Promise.all([
                    fetch('/api/games'),
                    fetch('/api/internal/banks')
                ])
                const gData = await gRes.json()
                const bData = await bRes.json()
                if (Array.isArray(gData)) setGames(gData)
                if (Array.isArray(bData)) setBanks(bData)
            } catch (e) {
                console.error(e)
            }
        }
        init()
    }, [])

    // Automatic calculation when money changes (TOPUP)
    const handleMoneyChange = (rawMoney: string) => {
        setFormData(prev => {
            const next = { ...prev, amount_money: rawMoney }
            if (type === 'TOPUP' && rawMoney && Number(rawMoney) > 0) {
                const calc = hitungChipTop(rawMoney, specialRate)
                next.amount_chip = calc.chip ? String(calc.chip) : ''
            }
            return next
        })
    }

    // Automatic calculation when chip changes (WITHDRAW)
    const handleChipChange = (rawChip: string) => {
        setFormData(prev => {
            const next = { ...prev, amount_chip: rawChip }
            if (type === 'WITHDRAW' && rawChip && Number(rawChip) > 0) {
                const selBank = banks.find(b => b.id === Number(prev.payment_method_id))?.name || 'BCA TAMBI'
                const calc = hitungNominalWd(Number(rawChip), selBank, '')
                next.amount_money = calc.nominal ? String(calc.nominal) : ''
            }
            return next
        })
    }

    // Recompute on special rate change
    useEffect(() => {
        if (type === 'TOPUP' && formData.amount_money) {
            const calc = hitungChipTop(formData.amount_money, specialRate)
            setFormData(prev => ({ ...prev, amount_chip: calc.chip ? String(calc.chip) : '' }))
        }
    }, [specialRate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
            const res = await fetch('/api/internal/manual-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': JSON.parse(localStorage.getItem('user') || '{}').id || '1'
                },
                body: JSON.stringify({
                    type,
                    ...formData,
                    amount_chip: Number(formData.amount_chip),
                    amount_money: Number(formData.amount_money),
                    game_id: Number(formData.game_id),
                    payment_method_id: Number(formData.payment_method_id)
                })
            })

            if (res.ok) {
                setSuccess(true)
                setFormData({
                    user_wa: '',
                    nickname: '',
                    game_id: '',
                    user_game_id: '',
                    amount_chip: '',
                    amount_money: '',
                    payment_method_id: '',
                    note: ''
                })
                alert('Transaksi Berhasil Disimpan & Sinkron ke Sistem!')
            } else {
                const err = await res.json()
                alert('Gagal: ' + (err.error || 'Terjadi kesalahan'))
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan koneksi server')
        } finally {
            setLoading(false)
        }
    }

    const selectedGame = games.find(g => g.id === Number(formData.game_id))
    const filteredBanks = banks.filter(b => {
        if (!selectedGame) return true
        return !b.store_name || b.store_name === selectedGame.store_name
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHead
                crumbs={['Transaksi', 'Input Cepat']}
                title="Input Cepat Transaksi CS"
                sub="Form input cepat dengan mesin hitung rate otomatis (Tabel HEHE, Tiered Rate, dan Fee Matrix)"
            />

            {/* Type Switcher */}
            <div className="flex bg-[#131417] p-1.5 rounded-2xl border border-[#26282f] gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setType('TOPUP')
                        setFormData(prev => ({ ...prev, amount_chip: '', amount_money: '' }))
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        type === 'TOPUP'
                            ? 'bg-[#f5b301] text-[#1a1500] shadow-lg shadow-[#f5b301]/10'
                            : 'text-[#7e8593] hover:text-white'
                    }`}
                >
                    <ArrowUpCircle size={18} />
                    Top Up (Uang Masuk / Kirim Chip)
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setType('WITHDRAW')
                        setFormData(prev => ({ ...prev, amount_chip: '', amount_money: '' }))
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        type === 'WITHDRAW'
                            ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/10'
                            : 'text-[#7e8593] hover:text-white'
                    }`}
                >
                    <ArrowDownCircle size={18} />
                    Withdraw (Tarik Chip / Transfer Uang)
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <Panel
                    title={type === 'TOPUP' ? 'Data Pembelian Top Up' : 'Data Penarikan Withdraw'}
                    subtitle="Lengkapi data member dan rekening transaksi"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Pilih Game</label>
                            <SelectInput
                                value={formData.game_id}
                                onChange={e => setFormData({ ...formData, game_id: e.target.value })}
                                required
                                options={[
                                    { value: '', label: '-- Pilih Game --' },
                                    ...games.map(g => ({ value: String(g.id), label: `${g.name} ${g.store_name ? `(${g.store_name})` : ''}` }))
                                ]}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">ID Game Member</label>
                            <TextInput
                                type="text"
                                placeholder="cth: 15166432"
                                value={formData.user_game_id}
                                onChange={e => setFormData({ ...formData, user_game_id: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Nickname Member</label>
                            <TextInput
                                type="text"
                                placeholder="cth: Bayonet"
                                value={formData.nickname}
                                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Nomor WhatsApp Member</label>
                            <TextInput
                                type="text"
                                placeholder="cth: 08123456789"
                                value={formData.user_wa}
                                onChange={e => setFormData({ ...formData, user_wa: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="h-px bg-[#26282f] my-6" />

                    {/* Kalkulator Cepat */}
                    <div className="p-4 bg-[#0a0b0d] border border-[#26282f] rounded-2xl mb-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#f5b301]">
                                <Calculator size={16} />
                                <span>Mesin Hitung Otomatis Royal Clover</span>
                            </div>
                            {type === 'TOPUP' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#7e8593]">Rate:</span>
                                    <select
                                        value={specialRate}
                                        onChange={e => setSpecialRate(e.target.value)}
                                        className="bg-[#1b1d22] border border-[#26282f] text-xs text-[#f3f5f8] rounded-lg px-2 py-1 outline-none"
                                    >
                                        <option value="">AUTO (Tabel & Tier)</option>
                                        <option value="X62">VIP X62 (Divisor 62.000)</option>
                                        <option value="X61">VIP X61 (Divisor 61.000)</option>
                                        <option value="X60">VIP X60 (Divisor 60.000)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">
                                    {type === 'TOPUP' ? 'Nominal Bayar (Rp) *' : 'Nominal Bersih yang Diterima (Rp) *'}
                                </label>
                                <TextInput
                                    type="number"
                                    placeholder="cth: 195000"
                                    value={formData.amount_money}
                                    onChange={e => handleMoneyChange(e.target.value)}
                                    required
                                />
                                {formData.amount_money && (
                                    <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                                        {rp(formData.amount_money)}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">
                                    {type === 'TOPUP' ? 'Chip yang Dikirim (B) *' : 'Chip yang Ditarik dari Member (B) *'}
                                </label>
                                <TextInput
                                    type="number"
                                    step="any"
                                    placeholder="cth: 3"
                                    value={formData.amount_chip}
                                    onChange={e => handleChipChange(e.target.value)}
                                    required
                                />
                                {formData.amount_chip && (
                                    <div className="text-[11px] text-[#f5b301] mt-1 font-mono">
                                        {num(Number(formData.amount_chip))} B Chip
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Rekening Bank Operasional</label>
                            <SelectInput
                                value={formData.payment_method_id}
                                onChange={e => setFormData({ ...formData, payment_method_id: e.target.value })}
                                required
                                options={[
                                    { value: '', label: '-- Pilih Rekening --' },
                                    ...filteredBanks.map(b => ({ value: String(b.id), label: `${b.name} (${b.account_number})` }))
                                ]}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#7e8593] font-semibold mb-1.5 block">Catatan Tambahan (Opsional)</label>
                            <TextInput
                                placeholder="cth: Transaksi CS Shift Malam"
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <PrimaryBtn type="submit" className="px-6 py-2.5">
                            <Save size={16} />
                            {loading ? 'Menyimpan...' : 'Simpan Transaksi Manual'}
                        </PrimaryBtn>
                    </div>
                </Panel>
            </form>
        </div>
    )
}
