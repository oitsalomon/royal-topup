'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Check, Copy, Clock, AlertTriangle } from 'lucide-react'
import { formatIDR } from '@/lib/utils' // Assuming this exists or I'll use localseString
import Image from 'next/image'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    transaction: any
    onUploadProof: (file: File) => Promise<void>
    isMember?: boolean
}

// Helper to format IDR if import fails
const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

export default function PaymentModal({ isOpen, onClose, transaction, onUploadProof, isMember }: PaymentModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [timeLeft, setTimeLeft] = useState<string>('')
    const [expired, setExpired] = useState(false)

    // Reset state when modal opens/transaction changes
    useEffect(() => {
        if (isOpen) {
            setFile(null)
            setUploading(false)
            setExpired(false)
        }
    }, [isOpen, transaction])

    // Timer Logic
    useEffect(() => {
        if (!isOpen || !transaction) return

        const expiryTime = new Date(transaction.createdAt).getTime() + 5 * 60 * 1000 // 5 Minutes

        const timer = setInterval(() => {
            const now = new Date().getTime()
            const distance = expiryTime - now

            if (distance < 0) {
                clearInterval(timer)
                setExpired(true)
                setTimeLeft('00:00')
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((distance % (1000 * 60)) / 1000)
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [isOpen, transaction])

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Disalin: ' + text)
    }

    const handleSubmit = async () => {
        if (!file) return
        setUploading(true)
        try {
            await onUploadProof(file)
        } catch (error) {
            console.error(error)
            alert('Gagal upload bukti')
        } finally {
            setUploading(false)
        }
    }

    if (!isOpen || !transaction) return null

    const uniqueCode = transaction.amount_money % 1000
    const paymentMethod = transaction.paymentMethod || {}
    const isQRIS = paymentMethod.name?.toLowerCase().includes('qris') || paymentMethod.image

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e293b] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div>
                        <h3 className="text-lg font-bold text-white">Selesaikan Pembayaran</h3>
                        <p className="text-xs text-gray-400">Order ID: #{transaction.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-6 space-y-6">

                    {/* Timer */}
                    <div className={`flex justify-center items-center gap-2 p-3 rounded-xl ${expired ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        <Clock size={18} />
                        <span className="font-mono font-bold text-lg">
                            {expired ? 'Waktu Habis' : timeLeft}
                        </span>
                    </div>

                    {/* Total Amount Box */}
                    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 rounded-2xl border border-indigo-500/30 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition"></div>
                        <p className="text-gray-300 text-sm mb-1">Total Yang Harus Dibayar</p>
                        <div className="flex items-center justify-center gap-2 mb-2 cursor-pointer" onClick={() => handleCopy(transaction.amount_money.toString())}>
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                {formatMoney(transaction.amount_money)}
                            </h2>
                            <Copy size={16} className="text-gray-500" />
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                            <AlertTriangle size={12} />
                            <span>PENTING: Transfer TEPAT sampai 3 digit terakhir!</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">Kode Unik: {uniqueCode}</p>
                    </div>

                    {/* QRIS / Bank Info */}
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                            Scan QRIS / Transfer Bank
                        </p>

                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                            {isQRIS ? (
                                <>
                                    {/* Using standard img for external URLs if standard Image fails or just use img for simplicity with dynamic URLs */}
                                    <div className="bg-white p-3 rounded-2xl mb-4 w-full max-w-[350px]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={paymentMethod.image || '/placeholder-qris.png'}
                                            alt="QRIS"
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                    <p className="font-bold text-white">{paymentMethod.name}</p>
                                    <p className="text-sm text-gray-400">A/N {paymentMethod.account_name}</p>
                                </>
                            ) : (
                                <div className="text-center w-full">
                                    <p className="text-sm text-gray-400 mb-1">{paymentMethod.name}</p>
                                    <div className="flex items-center justify-center gap-2 bg-white/5 p-3 rounded-xl mb-2 cursor-pointer" onClick={() => handleCopy(paymentMethod.account_number)}>
                                        <p className="text-xl font-bold text-white font-mono">{paymentMethod.account_number}</p>
                                        <Copy size={16} className="text-gray-500" />
                                    </div>
                                    <p className="text-sm text-gray-400">A/N {paymentMethod.account_name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Proof - HIDDEN IF MEMBER & QRIS */}
                    {isMember && isQRIS ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center animate-in fade-in zoom-in">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
                                <Check size={24} />
                            </div>
                            <h4 className="text-emerald-400 font-bold mb-1">Pembayaran Selesai?</h4>
                            <p className="text-xs text-gray-300">
                                Apabila sudah membayar, silakan klik tombol <strong>Selesai</strong> di bawah.
                                <br />Admin akan mengecek mutasi rekening secara otomatis.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                                Upload Bukti Transfer
                            </p>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={uploading || expired}
                                />
                                <div className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 transition-all ${file ? 'border-green-500 bg-green-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                    {file ? (
                                        <>
                                            <Check className="text-green-500" />
                                            <span className="text-sm text-green-400 font-bold truncate max-w-[200px]">{file.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="text-gray-400" size={20} />
                                            <span className="text-sm text-gray-400">Klik untuk upload bukti</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    {isMember && isQRIS ? (
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold hover:shadow-lg transition-all"
                        >
                            Selesai
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!file || uploading || expired}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {uploading ? 'Mengirim...' : 'Saya Sudah Transfer'}
                        </button>
                    )}

                    {expired && (
                        <p className="text-center text-xs text-red-400 mt-2">Waktu habis. Silakan buat pesanan baru.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
