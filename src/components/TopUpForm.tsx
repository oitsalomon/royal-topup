'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Check, AlertCircle, Shield, Zap, Wallet } from 'lucide-react'

interface PaymentMethod {
    id: number
    name: string
    type: string
    account_number: string
    account_name: string
    image?: string | null
}

interface Package {
    id: number
    name: string
    chip: number
    price: number
}

interface TopUpFormProps {
    gameCode: string
    gameName: string
}

export default function TopUpForm({ gameCode, gameName }: TopUpFormProps) {
    const router = useRouter()
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [packages, setPackages] = useState<Package[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        user_wa: '',
        id_game: '',
        nickname: '',
        amount_chip: '', // Stored in M
        payment_method_id: '',
        proof_image: ''
    })

    const [selectedPrice, setSelectedPrice] = useState<number>(0)
    const [manualMode, setManualMode] = useState(false)

    useEffect(() => {
        // Fetch Payment Methods
        fetch('/api/payment-methods')
            .then(res => res.json())
            .then(data => setPaymentMethods(data))
            .catch(err => console.error(err))

        // Fetch Packages
        fetch('/api/packages')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPackages(data)
                }
            })
            .catch(err => console.error(err))
    }, [])

    const [uploading, setUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploading(true)
            const formData = new FormData()
            formData.append('file', file)

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (res.ok) {
                    const data = await res.json()
                    setFormData(prev => ({ ...prev, proof_image: data.url }))
                } else {
                    alert('Gagal upload gambar. Coba lagi.')
                }
            } catch (err) {
                console.error(err)
                alert('Terjadi kesalahan saat upload.')
            } finally {
                setUploading(false)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        if (!formData.proof_image) {
            alert('Mohon upload bukti transfer terlebih dahulu.')
            setSubmitting(false)
            return
        }

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_wa: formData.user_wa,
                    game_id: 1,
                    user_game_id: formData.id_game,
                    nickname: formData.nickname,
                    amount_chip: Number(formData.amount_chip) / 1000,
                    amount_money: selectedPrice,
                    payment_method_id: formData.payment_method_id,
                    proof_image: formData.proof_image, // Already a URL now
                    type: 'TOPUP'
                })
            })

            if (res.ok) {
                alert('Top Up Berhasil Dikirim! Tunggu konfirmasi admin.')
                router.push('/')
            } else {
                alert('Gagal mengirim Top Up.')
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan.')
        } finally {
            setSubmitting(false)
        }
    }

    const selectedPayment = paymentMethods.find(p => p.id === Number(formData.payment_method_id))

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">

            {/* Section 1: Data Akun */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Shield size={20} />
                    </div>
                    1. Masukkan Data Akun
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">ID Game</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                            placeholder="Contoh: 12345678"
                            value={formData.id_game}
                            onChange={e => setFormData({ ...formData, id_game: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Nickname</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                            placeholder="Contoh: Sultan88"
                            value={formData.nickname}
                            onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Nomor WhatsApp</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                            placeholder="08xxxxxxxxxx"
                            value={formData.user_wa}
                            onChange={e => setFormData({ ...formData, user_wa: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 ml-1">*Bukti transaksi akan dikirim ke nomor ini</p>
                    </div>
                </div>
            </div>

            {/* Section 2: Nominal */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Zap size={20} />
                    </div>
                    2. Masukkan Nominal Top Up
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-400 ml-1 mb-2 block">Masukkan Nominal Uang (Rp)</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                            <input
                                type="number"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all pl-12"
                                placeholder="Contoh: 100000"
                                onChange={(e) => {
                                    const money = Number(e.target.value)
                                    setSelectedPrice(money)

                                    let chipsM = 0

                                    // Thresholds for Special Bulk Prices
                                    // 50B+ @ 63K/B -> 50 * 63000 = 3,150,000
                                    // 20B+ @ 64K/B -> 20 * 64000 = 1,280,000
                                    // 10B+ @ 64.5K/B -> 10 * 64500 = 645,000

                                    if (money >= 3150000) {
                                        chipsM = (money / 63000) * 1000
                                    } else if (money >= 1280000) {
                                        chipsM = (money / 64000) * 1000
                                    } else if (money >= 645000) {
                                        chipsM = (money / 64500) * 1000
                                    } else {
                                        // Standard Greedy Package Logic
                                        let remainingMoney = money
                                        const sortedPkgs = [...packages].sort((a, b) => b.price - a.price)

                                        if (sortedPkgs.length > 0) {
                                            for (const pkg of sortedPkgs) {
                                                while (remainingMoney >= pkg.price) {
                                                    chipsM += pkg.chip
                                                    remainingMoney -= pkg.price
                                                }
                                            }
                                        }

                                        // Fallback for remaining money (or small amounts) using base rate 65k/B
                                        if (remainingMoney > 0) {
                                            chipsM += (remainingMoney / 65000) * 1000
                                        }
                                    }

                                    setFormData(prev => ({ ...prev, amount_chip: chipsM.toString() }))
                                }}
                            />
                        </div>
                    </div>

                    {Number(formData.amount_chip) > 0 && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                            <span className="text-blue-400 text-sm">Anda Mendapatkan:</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-white block">
                                    {Number(formData.amount_chip) >= 1000
                                        ? `${(Math.floor((Number(formData.amount_chip) / 1000) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`
                                        : `${Number(formData.amount_chip).toLocaleString()} M`}
                                </span>
                                <span className="text-xs text-gray-500">
                                    (Rp {selectedPrice.toLocaleString()})
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 3: Pembayaran */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Wallet size={20} />
                    </div>
                    3. Metode Pembayaran
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map((pm) => (
                        <button
                            key={pm.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_method_id: pm.id.toString() })}
                            className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-300 ${formData.payment_method_id === pm.id.toString()
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/5'
                                }`}
                        >
                            <span className="font-bold">{pm.name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${formData.payment_method_id === pm.id.toString() ? 'bg-white/20' : 'bg-white/10'
                                }`}>{pm.type}</span>
                        </button>
                    ))}
                </div>

                {selectedPayment && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                        <p className="text-sm text-gray-400 mb-4 relative z-10">Silakan transfer / scan ke:</p>

                        {selectedPayment.image ? (
                            <div className="flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-300">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedPayment.image}
                                    alt="QRIS"
                                    className="w-56 h-auto object-contain rounded-xl border-4 border-white shadow-2xl mb-4"
                                />
                                <div className="space-y-1">
                                    <p className="text-xl font-bold text-white">{selectedPayment.name}</p>
                                    <p className="text-sm text-purple-400">A/N {selectedPayment.account_name}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 animate-in fade-in">
                                <p className="text-3xl font-bold text-white tracking-wider mb-1 font-mono">{selectedPayment.account_number}</p>
                                <p className="text-sm text-purple-400">A/N {selectedPayment.account_name}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Section 4: Upload Bukti */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                        <Upload size={20} />
                    </div>
                    4. Upload Bukti Transfer
                </h3>

                <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer relative group">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        required
                    />
                    {formData.proof_image ? (
                        <div className="flex flex-col items-center text-green-400 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <Check className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-lg">Bukti Berhasil Diupload</span>
                            <span className="text-sm opacity-70 mt-1">Klik untuk mengganti</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-green-400 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-green-500/20 flex items-center justify-center mb-4 transition-colors">
                                <Upload className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-lg">Klik atau Drop File Disini</span>
                            <span className="text-sm opacity-50 mt-1">Format: JPG, PNG, JPEG</span>
                        </div>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-bold text-lg py-5 rounded-2xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                    {submitting ? 'Sedang Memproses...' : 'Kirim Pesanan Sekarang'}
                    {!submitting && <Zap size={20} fill="currentColor" />}
                </span>
            </button>

        </form>
    )
}
