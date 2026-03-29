'use client'

import { useEffect, useState } from 'react'
import { Check, Clock, Loader2, XCircle, AlertTriangle, Phone } from 'lucide-react'
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
                    icon: <Loader2 className="w-16 h-16 text-purple-400 animate-spin drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />,
                    title: 'Menunggu Sultan',
                    desc: 'Admin sedang mengecek pesanan Anda...',
                    color: 'text-purple-400',
                    border: 'border-purple-500/30',
                    glow: 'bg-purple-500/10'
                }
            case 'APPROVED_1':
            case 'PROCESSING':
                return {
                    icon: <Loader2 className="w-16 h-16 text-cyan-400 animate-spin drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />,
                    title: 'Sedang Diproses',
                    desc: 'Pembayaran diterima! Sultan sedang memproses...',
                    color: 'text-cyan-400',
                    border: 'border-cyan-500/30',
                    glow: 'bg-cyan-500/10'
                }
            case 'APPROVED_2':
            case 'SUCCESS':
                return {
                    icon: <Check className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />,
                    title: 'Petualangan Selesai!',
                    desc: 'Pesanan telah berhasil diproses ke akun Anda.',
                    color: 'v4-text-gradient',
                    border: 'border-purple-500/30',
                    glow: 'bg-purple-500/10',
                    canClose: true
                }
            case 'DECLINED':
            case 'FAILED':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />,
                    title: 'Misi Gagal',
                    desc: 'Maaf, transaksi Anda tidak dapat diproses.',
                    color: 'text-red-500',
                    border: 'border-red-500/30',
                    glow: 'bg-red-500/10',
                    canClose: true
                }
            default:
                return {
                    icon: <Loader2 className="w-16 h-16 text-gray-500 animate-spin" />,
                    title: 'Memuat Data...',
                    desc: 'Menghubungkan ke server Clover...',
                    color: 'text-gray-500',
                    border: 'border-white/10',
                    glow: 'bg-white/5'
                }
        }
    }

    const content = getStatusContent()

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-4 bg-[#050912]/95 backdrop-blur-2xl transition-all">
            <div className={`w-full max-w-md v4-glass border ${content.border} p-10 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95 duration-500 group`}>
                
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 ${content.glow} blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/2`} />
                <div className={`absolute bottom-0 left-0 w-40 h-40 ${content.glow} blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000 translate-y-1/2 -translate-x-1/2`} />

                {/* Status Icon */}
                <div className="flex justify-center mb-10 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center shadow-2xl backdrop-blur-md relative z-10">
                            {content.icon}
                        </div>
                        <div className={`absolute -inset-4 ${content.glow} blur-2xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-700`} />
                    </div>
                </div>

                {/* Status Text */}
                <div className="text-center space-y-3 mb-10 relative z-10">
                    <h3 className={`v4-font-syne text-3xl font-black ${content.color} uppercase tracking-tight`}>
                        {content.title}
                    </h3>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-relaxed opacity-70">
                        {content.desc}
                    </p>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-3 mb-10 relative z-10 px-4">
                    <div className={`h-1.5 flex-1 rounded-full ${status === 'PENDING' ? 'bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]' : status !== 'FAILED' ? 'bg-purple-500' : 'bg-red-500/20'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${['APPROVED_1', 'PROCESSING', 'APPROVED_2', 'SUCCESS'].includes(status) ? 'bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-white/10'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${['APPROVED_2', 'SUCCESS'].includes(status) ? 'bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10'}`} />
                </div>

                {/* Warning / Contact Info */}
                <div className="bg-black/40 rounded-[32px] p-8 border border-white/5 text-center relative z-10 backdrop-blur-sm">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 leading-none">
                        Dilarang menutup halaman ini
                    </p>

                    {content.canClose ? (
                        <button
                            onClick={() => {
                                if (onClose) onClose()
                                router.push('/check-transaction')
                            }}
                            className="v4-btn-main w-full py-5 rounded-2xl text-white font-black text-[10px] tracking-[0.3em] uppercase transition-all shadow-2xl"
                        >
                            Selesai & Cek Riwayat
                        </button>
                    ) : (
                        <div className="animate-in fade-in duration-1000 slide-in-from-bottom-2">
                            <div className="flex items-center justify-center gap-3 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                <Clock size={14} />
                                <span>Proses: 1-5 Menit</span>
                            </div>
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-6">
                                Update otomatis setiap 5 detik
                            </p>
                            <a
                                href={`https://wa.me/${contactWa || '6281234567890'}`}
                                target="_blank"
                                rel="noreferrer"
                                className="v4-btn-main w-full py-5 rounded-2xl text-white font-black text-[10px] tracking-[0.3em] uppercase transition-all shadow-2xl flex items-center justify-center gap-2"
                            >
                                <Phone size={14} className="animate-pulse" />
                                Hubungi Admin
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

