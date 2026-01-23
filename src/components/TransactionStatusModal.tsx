'use client'

import { useEffect, useState } from 'react'
import { Check, Clock, Loader2, XCircle, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TransactionStatusModalProps {
    isOpen: boolean
    transactionId: number | null
    onClose?: () => void
    // Note: onClose might not be exposed to user if strictly non-closable, 
    // but useful for internal logic or completion.
}

export default function TransactionStatusModal({ isOpen, transactionId, onClose }: TransactionStatusModalProps) {
    const router = useRouter()
    const [status, setStatus] = useState<string>('PENDING')
    const [isLongWait, setIsLongWait] = useState(false)
    const [contactWa, setContactWa] = useState<string>('')

    // Fetch Config & Polling Logic
    useEffect(() => {
        if (!isOpen) return

        // 1. Fetch Config for WhatsApp
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                const waNumber = data.contacts?.whatsapp?.number
                if (waNumber) {
                    // Sanitize number: remove +, space, or leading 0 if starting with region code
                    let num = waNumber.replace(/[^0-9]/g, '')
                    if (num.startsWith('0')) num = '62' + num.slice(1)
                    setContactWa(num)
                }
            })
            .catch(err => console.error('Failed to fetch config', err))

        if (!transactionId) return

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/transactions/${transactionId}`)
                if (res.ok) {
                    const data = await res.json()
                    setStatus(data.status)
                }
            } catch (error) {
                console.error('Failed to poll status', error)
            }
        }

        // Initial check
        checkStatus()

        // Poll every 5 seconds
        const interval = setInterval(checkStatus, 5000)

        // Long wait warning after 5 minutes
        const timer = setTimeout(() => {
            setIsLongWait(true)
        }, 5 * 60 * 1000)

        return () => {
            clearInterval(interval)
            clearTimeout(timer)
        }
    }, [isOpen, transactionId])

    if (!isOpen) return null

    const getStatusContent = () => {
        switch (status) {
            case 'PENDING':
                return {
                    icon: <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />,
                    title: 'Menunggu Konfirmasi',
                    desc: 'Admin sedang mengecek pesanan Anda...',
                    color: 'text-yellow-500',
                    bg: 'bg-yellow-500/10 border-yellow-500/20'
                }
            case 'APPROVED_1':
            case 'PROCESSING':
                return {
                    icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
                    title: 'Sedang Diproses',
                    desc: 'Pembayaran diterima! Sedang memproses pengiriman...',
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10 border-blue-500/20'
                }
            case 'APPROVED_2':
            case 'SUCCESS':
                return {
                    icon: <Check className="w-16 h-16 text-emerald-500" />,
                    title: 'Transaksi Berhasil!',
                    desc: 'Pesanan telah selesai diproses.',
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10 border-emerald-500/20',
                    canClose: true
                }
            case 'DECLINED':
            case 'FAILED':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    title: 'Transaksi Gagal',
                    desc: 'Maaf, transaksi Anda dibatalkan.',
                    color: 'text-red-500',
                    bg: 'bg-red-500/10 border-red-500/20',
                    canClose: true
                }
            default:
                return {
                    icon: <Loader2 className="w-16 h-16 text-gray-500 animate-spin" />,
                    title: 'Memuat Status...',
                    desc: 'Harap tunggu sebentar...',
                    color: 'text-gray-500',
                    bg: 'bg-gray-500/10 border-gray-500/20'
                }
        }
    }

    const content = getStatusContent()

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
            <div className={`w-full max-w-md ${content.bg} border p-8 rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300`}>

                {/* Status Icon */}
                <div className="flex justify-center mb-6">
                    <div className={`p-6 rounded-full bg-[#0a0f1c] border border-white/5 shadow-inner`}>
                        {content.icon}
                    </div>
                </div>

                {/* Status Text */}
                <div className="text-center space-y-2 mb-8">
                    <h3 className={`text-2xl font-bold ${content.color}`}>
                        {content.title}
                    </h3>
                    <p className="text-gray-300">
                        {content.desc}
                    </p>
                </div>

                {/* Steps Indicator (Simple) */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`h-1 flex-1 rounded-full ${status === 'PENDING' ? 'bg-yellow-500 animate-pulse' : status !== 'FAILED' ? 'bg-emerald-500' : 'bg-red-500/20'}`} />
                    <div className={`h-1 flex-1 rounded-full ${['APPROVED_1', 'PROCESSING', 'APPROVED_2', 'SUCCESS'].includes(status) ? 'bg-blue-500 animate-pulse' : 'bg-white/10'}`} />
                    <div className={`h-1 flex-1 rounded-full ${['APPROVED_2', 'SUCCESS'].includes(status) ? 'bg-emerald-500' : 'bg-white/10'}`} />
                </div>

                {/* Warning / Contact Info */}
                <div className="bg-[#0a0f1c]/50 rounded-xl p-4 border border-white/5 text-center">
                    <p className="text-xs text-gray-400 mb-3">
                        Mohon jangan menutup halaman ini sampai status berubah.
                    </p>

                    {content.canClose ? (
                        <button
                            onClick={() => {
                                if (onClose) onClose()
                                router.push('/check-transaction')
                            }}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-colors"
                        >
                            Tutup & Cek Riwayat
                        </button>
                    ) : (
                        <div className="animate-in fade-in duration-700">
                            <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs mb-2">
                                <Clock size={12} />
                                <span>Estimasi proses: 1-5 Menit</span>
                            </div>
                            <p className="text-[10px] text-gray-500">
                                Jika status tidak berubah dalam 5 menit, harap hubungi CS kami.
                            </p>
                            <a
                                href={`https://wa.me/${contactWa || '6281234567890'}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 block w-full py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Hubungi CS via WhatsApp
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

