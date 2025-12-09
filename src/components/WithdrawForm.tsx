'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Check, AlertTriangle, Shield, Coins, Wallet } from 'lucide-react'

interface PaymentMethod {
    id: number
    name: string
    type: string
}

interface WithdrawFormProps {
    gameCode: string
    gameName: string
}

export default function WithdrawForm({ gameCode, gameName }: WithdrawFormProps) {
    const router = useRouter()
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        user_wa: '',
        id_game: '',
        nickname: '',
        amount_chip: '',
        payment_method_id: '',
        target_account_number: '',
        target_account_name: '',
        proof_image: ''
    })


    const [amountB, setAmountB] = useState('')
    const [amountM, setAmountM] = useState('')
    const [config, setConfig] = useState<{ id_wd?: { value: string, nickname: string } } | null>(null)

    useEffect(() => {
        fetch('/api/payment-methods')
            .then(res => res.json())
            .then(data => setPaymentMethods(data))
            .catch(err => console.error(err))

        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error(err))
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, proof_image: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const totalM = (Number(amountB) * 1000) + Number(amountM)

            if (totalM <= 0) {
                alert('Mohon masukkan jumlah chip')
                setSubmitting(false)
                return
            }

            let amount_money = 0

            if (totalM === 500) {
                amount_money = 25000
            } else {
                amount_money = (totalM / 1000) * 60000
            }

            const target_details = `${formData.target_account_name} - ${formData.target_account_number}`

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_wa: formData.user_wa,
                    game_id: 1,
                    user_game_id: formData.id_game,
                    nickname: formData.nickname,
                    amount_chip: totalM / 1000, // Convert Total M to B for DB
                    amount_money: amount_money,
                    payment_method_id: formData.payment_method_id,
                    proof_image: formData.proof_image,
                    type: 'WITHDRAW',
                    target_payment_details: target_details
                })
            })

            if (res.ok) {
                alert('Permintaan Withdraw Berhasil Dikirim! Tunggu konfirmasi admin.')
                router.push('/')
            } else {
                alert('Gagal mengirim Withdraw.')
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">

            {/* Info Transfer Chip */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl flex items-start gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h4 className="text-yellow-400 font-bold text-lg mb-1">PENTING!</h4>
                    <p className="text-gray-300 leading-relaxed">
                        Silakan transfer chip ke ID Admin: <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{config?.id_wd?.value || 'Loading...'} ({config?.id_wd?.nickname || 'Loading...'})</span>.
                        <br />
                        Jangan lupa screenshot bukti transfer chip di dalam game.
                    </p>
                </div>
            </div>

            {/* Section 1: Data Akun */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Shield size={20} />
                    </div>
                    1. Data Akun Game
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">ID Game</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                            placeholder="ID Game Anda"
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
                            placeholder="Nickname"
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
                    </div>
                </div>
            </div>





            {/* Section 2: Nominal */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Coins size={20} />
                    </div>
                    2. Nominal Withdraw
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-lg font-bold pl-16"
                            placeholder="0"
                            value={amountB}
                            onChange={e => setAmountB(e.target.value)}
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">B</div>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-lg font-bold pl-16"
                            placeholder="0"
                            value={amountM}
                            onChange={e => setAmountM(e.target.value)}
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">M</div>
                    </div>
                </div>

                {(amountB || amountM) && (
                    <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center">
                        <span className="text-blue-400 text-sm">Estimasi Uang Diterima:</span>
                        <span className="text-xl font-bold text-white">
                            Rp {(() => {
                                const totalM = (Number(amountB) * 1000) + Number(amountM)
                                if (totalM === 500) return (25000).toLocaleString()
                                return ((totalM / 1000) * 60000).toLocaleString()
                            })()}
                        </span>
                    </div>
                )}
            </div>

            {/* Section 3: Rekening Penerima */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Wallet size={20} />
                    </div>
                    3. Rekening Penerima
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {paymentMethods.map((pm) => (
                        <button
                            key={pm.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_method_id: pm.id.toString() })}
                            className={`px-4 py-3 rounded-xl border transition-all duration-300 ${formData.payment_method_id === pm.id.toString()
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/5'
                                }`}
                        >
                            <span className="font-medium">{pm.name}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Nomor Rekening / E-Wallet</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            placeholder="Contoh: 1234567890"
                            value={formData.target_account_number}
                            onChange={e => setFormData({ ...formData, target_account_number: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Atas Nama</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            placeholder="Nama Pemilik Rekening"
                            value={formData.target_account_name}
                            onChange={e => setFormData({ ...formData, target_account_name: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Section 4: Bukti Transfer Chip */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                        <Upload size={20} />
                    </div>
                    4. Bukti Kirim Chip
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
                            <span className="font-bold text-lg">Upload Screenshot Game</span>
                            <span className="text-sm opacity-50 mt-1">Pastikan ID & Nominal terlihat jelas</span>
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
                <span className="relative">Kirim Permintaan Withdraw</span>
            </button>

        </form>
    )
}
