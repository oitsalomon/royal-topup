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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-4 bg-[#050912]/95 backdrop-blur-2xl animate-in fade-in duration-500">
            <div className="v4-glass w-full max-w-md rounded-[40px] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 relative group">
                
                {/* Background Glows */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10 backdrop-blur-md">
                    <div>
                        <h3 className="v4-font-syne text-2xl font-black text-white uppercase tracking-tight">Pembayaran <span className="v4-text-gradient">Sultan</span></h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Order ID: #{transaction.id}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/5">
                        <X size={18} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-10 space-y-10 relative z-10">

                    {/* Timer */}
                    <div className={`flex justify-center items-center gap-3 p-5 rounded-[24px] border ${expired ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-purple-500/5 border-purple-500/20 text-purple-400'} shadow-inner`}>
                        <Clock size={16} className={!expired ? 'animate-pulse' : ''} />
                        <span className="v4-font-syne font-black text-xl tracking-[0.2em]">
                            {expired ? 'WAKTU HABIS' : timeLeft}
                        </span>
                    </div>

                    {/* Total Amount Box */}
                    <div className="v4-glass p-8 rounded-[32px] border-purple-500/20 text-center relative overflow-hidden group/amount shadow-2xl">
                        <div className="absolute inset-0 bg-purple-500/5 group-hover/amount:bg-purple-500/10 transition-colors duration-700"></div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 opacity-70">Total Pembayaran</p>
                        <div className="flex items-center justify-center gap-3 mb-4 cursor-pointer active:scale-95 transition-transform" onClick={() => handleCopy(transaction.amount_money.toString())}>
                            <h2 className="v4-font-syne text-4xl font-black text-white tracking-tighter">
                                {formatMoney(transaction.amount_money)}
                            </h2>
                            <Copy size={16} className="text-gray-500 hover:text-purple-400 transition-colors" />
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest">
                            <AlertTriangle size={12} className="text-cyan-400" />
                            <span>Transfer Tepat sampai 3 digit terakhir!</span>
                        </div>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mt-4">Kode Unik: {uniqueCode}</p>
                    </div>

                    {/* QRIS / Bank Info */}
                    <div className="space-y-6">
                        <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400">01</span>
                            Metode Pembayaran
                        </p>

                        <div className="bg-black/40 p-10 rounded-[32px] border border-white/5 flex flex-col items-center shadow-inner backdrop-blur-md">
                            {isQRIS ? (
                                <>
                                    <div className="bg-white p-5 rounded-[32px] mb-8 w-full max-w-[280px] shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-[1.02] transition-transform duration-700">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={paymentMethod.image || '/placeholder-qris.png'}
                                            alt="QRIS"
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                    <h4 className="v4-font-syne text-xl font-black text-white uppercase tracking-tight">{paymentMethod.name}</h4>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">A/N {paymentMethod.account_name}</p>
                                </>
                            ) : (
                                <div className="text-center w-full">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{paymentMethod.name}</p>
                                    <div className="flex items-center justify-center gap-4 bg-white/5 p-5 rounded-2xl mb-4 border border-white/5 cursor-pointer active:scale-95 transition-all group/copy" onClick={() => handleCopy(paymentMethod.account_number)}>
                                        <p className="text-2xl font-black text-white tracking-[0.1em]">{paymentMethod.account_number}</p>
                                        <Copy size={18} className="text-gray-500 group-hover/copy:text-cyan-400 transition-colors" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">A/N {paymentMethod.account_name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2 Section */}
                    <div className="space-y-6">
                        <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400">02</span>
                            Konfirmasi Transfer
                        </p>

                        {isMember && isQRIS ? (
                            <div className="v4-glass p-8 rounded-[32px] border-cyan-500/20 text-center shadow-xl animate-in fade-in zoom-in duration-700">
                                <div className="w-16 h-16 bg-cyan-500/10 rounded-[20px] border border-cyan-500/20 flex items-center justify-center mx-auto mb-6 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                    <Check size={32} />
                                </div>
                                <h4 className="v4-font-syne text-xl font-black text-cyan-400 uppercase tracking-tight mb-2">OTOMATIS AKTIF</h4>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-relaxed">
                                    Klik tombol <span className="text-cyan-400">Selesai</span>. Mutasi akan dicek otomatis oleh sistem Sultan.
                                </p>
                            </div>
                        ) : (
                            <div className="relative group/upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={uploading || expired}
                                />
                                <div className={`border-2 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 shadow-inner'}`}>
                                    {file ? (
                                        <>
                                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                                <Check size={28} />
                                            </div>
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest truncate max-w-[200px]">{file.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover/upload:text-purple-400 transition-colors">
                                                <Upload size={28} />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload Bukti Transfer</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 relative z-10 backdrop-blur-md">
                    {isMember && isQRIS ? (
                        <button
                            onClick={onClose}
                            className="v4-btn-main w-full py-6 rounded-[24px] text-white font-black text-xs tracking-[0.3em] uppercase transition-all shadow-2xl shadow-purple-500/20 active:scale-95"
                        >
                            SELESAI
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!file || uploading || expired}
                            className="v4-btn-main w-full py-6 rounded-[24px] text-white font-black text-xs tracking-[0.3em] uppercase transition-all shadow-2xl shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            {uploading ? 'MEMPROSES...' : 'SAYA SUDAH TRANSFER'}
                        </button>
                    )}

                    {expired && (
                        <p className="text-center text-[9px] font-black text-red-500 uppercase tracking-widest mt-5 animate-pulse">Waktu habis. Silakan buat pesanan baru.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
