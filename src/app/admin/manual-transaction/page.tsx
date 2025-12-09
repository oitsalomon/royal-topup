'use client'

import { useState, useEffect } from 'react'
import { ArrowUpCircle, ArrowDownCircle, Save, Upload } from 'lucide-react'

export default function ManualTransactionPage() {
    const [type, setType] = useState<'TOPUP' | 'WITHDRAW'>('TOPUP')
    const [paymentMethods, setPaymentMethods] = useState<any[]>([])

    // Additional fields for inputs
    const [targetAccountName, setTargetAccountName] = useState('')
    const [targetAccountNumber, setTargetAccountNumber] = useState('')

    // File Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        user_wa: '',
        nickname: '',
        amount_chip: '',
        chip_unit: 'B', // 'B' | 'M'
        amount_money: '',
        payment_method_id: '',
        game_id: '1'
    })

    // Fetch Payment Methods on mount
    useEffect(() => {
        fetch('/api/payment-methods')
            .then(res => res.json())
            .then(data => {
                setPaymentMethods(data)
                // Set default if available
                if (data && data.length > 0) {
                    setFormData(prev => ({ ...prev, payment_method_id: data[0].id }))
                }
            })
            .catch(err => console.error(err))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setUploading(true)

        try {
            let proofImageUrl = ''

            // 1. Upload File if selected
            if (selectedFile) {
                const formData = new FormData()
                formData.append('file', selectedFile)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json()
                    proofImageUrl = uploadData.url
                } else {
                    alert('Gagal mengupload gambar')
                    setUploading(false)
                    return
                }
            }

            // Convert Chip Amount based on Unit
            let finalChipAmount = Number(formData.amount_chip)
            if (formData.chip_unit === 'M') {
                finalChipAmount = finalChipAmount / 1000
            }

            // Construct payload based on type
            const payload: any = {
                ...formData,
                type,
                amount_chip: finalChipAmount, // Send as standard B (float)
                amount_money: Number(formData.amount_money),
                proof_image: proofImageUrl // Include the image URL
            }

            if (type === 'WITHDRAW') {
                payload.target_payment_details = `${targetAccountName} - ${targetAccountNumber}`
            }

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert('Transaksi Berhasil Dibuat!')
                // Reset form
                setFormData({
                    user_wa: '',
                    nickname: '',
                    amount_chip: '',
                    chip_unit: 'B',
                    amount_money: '',
                    payment_method_id: paymentMethods[0]?.id || '',
                    game_id: '1'
                })
                setTargetAccountName('')
                setTargetAccountNumber('')
                setSelectedFile(null)
            } else {
                const data = await res.json()
                alert(`Gagal: ${data.error || 'Terjadi kesalahan'}`)
            }
        } catch (error) {
            console.error('Error submitting transaction:', error)
            alert('Terjadi kesalahan koneksi')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Input Transaksi Manual</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Input */}
                <div className="glass p-8 rounded-2xl">
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setType('TOPUP')}
                            className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${type === 'TOPUP' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/20 border-transparent text-gray-500 hover:bg-white/5'}`}
                        >
                            <ArrowUpCircle size={24} />
                            <span className="font-bold">Top Up Manual</span>
                        </button>
                        <button
                            onClick={() => setType('WITHDRAW')}
                            className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${type === 'WITHDRAW' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-black/20 border-transparent text-gray-500 hover:bg-white/5'}`}
                        >
                            <ArrowDownCircle size={24} />
                            <span className="font-bold">Withdraw Manual</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">WhatsApp User</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                value={formData.user_wa} onChange={e => setFormData({ ...formData, user_wa: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Nickname Game</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                value={formData.nickname} onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Jumlah Chip</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                        value={formData.amount_chip} onChange={e => setFormData({ ...formData, amount_chip: e.target.value })}
                                        required
                                    />
                                    <select
                                        className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-yellow-500 font-bold focus:border-cyan-500 outline-none"
                                        value={formData.chip_unit}
                                        onChange={e => setFormData({ ...formData, chip_unit: e.target.value })}
                                    >
                                        <option value="B">B</option>
                                        <option value="M">M</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Nominal Uang (Rp)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:border-cyan-500 outline-none"
                                        value={formData.amount_money} onChange={e => setFormData({ ...formData, amount_money: e.target.value })}
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">Rp</span>
                                </div>
                            </div>
                        </div>

                        {type === 'TOPUP' && (
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Bank Tujuan (User Transfer Ke)</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none appearance-none"
                                    value={formData.payment_method_id}
                                    onChange={e => setFormData({ ...formData, payment_method_id: e.target.value })}
                                    required
                                >
                                    <option value="">Pilih Bank</option>
                                    {paymentMethods.map(pm => (
                                        <option key={pm.id} value={pm.id}>{pm.name} - {pm.account_number}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {type === 'WITHDRAW' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Nama Rekening User</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                        value={targetAccountName} onChange={e => setTargetAccountName(e.target.value)}
                                        placeholder="Atas Nama"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">No Rekening User</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                        value={targetAccountNumber} onChange={e => setTargetAccountNumber(e.target.value)}
                                        placeholder="Nomor Rekening"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Bukti Transfer (Opsional)</label>
                            <div className="flex items-center gap-4">
                                <label className="cursor-pointer bg-black/40 border border-white/10 hover:border-cyan-500 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-all">
                                    <Upload size={20} className="text-gray-400" />
                                    <span className="text-sm text-gray-300">{selectedFile ? selectedFile.name : 'Pilih Gambar...'}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedFile(e.target.files[0])
                                            }
                                        }}
                                    />
                                </label>
                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFile(null)}
                                        className="text-red-400 hover:text-red-300 text-sm underline"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-8 transition-all ${uploading
                                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                }`}
                        >
                            {uploading ? (
                                <span>Mengupload...</span>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Proses Transaksi
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Preview / Info */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-2xl border-l-4 border-yellow-500">
                        <h3 className="font-bold text-white mb-2">Penting!</h3>
                        <p className="text-sm text-gray-400">
                            Transaksi manual ini akan <strong>langsung memotong/menambah saldo internal</strong> (Bank & ID Game) tanpa melalui approval 2 tahap.
                            Pastikan data yang diinput sudah benar.
                        </p>
                    </div>

                    <div className="glass p-6 rounded-2xl">
                        <h3 className="font-bold text-white mb-4">Estimasi Mutasi Internal</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Saldo Bank {type === 'TOPUP' && formData.payment_method_id ? `(${paymentMethods.find(p => p.id == formData.payment_method_id)?.name})` : ''}</span>
                                <span className={type === 'TOPUP' ? 'text-green-400' : 'text-red-400'}>
                                    {type === 'TOPUP' ? '+' : '-'} Rp {Number(formData.amount_money).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Stok Chip ID</span>
                                <span className={type === 'TOPUP' ? 'text-red-400' : 'text-green-400'}>
                                    {type === 'TOPUP' ? '-' : '+'} {formData.amount_chip} {formData.chip_unit}
                                </span>
                            </div>
                            {formData.chip_unit === 'M' && (
                                <div className="flex justify-end text-xs text-gray-500">
                                    (Setara {Number(formData.amount_chip) / 1000} B)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
