'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import NextImage from 'next/image'
import { Upload, Check, AlertCircle, Shield, Zap, Wallet, Copy } from 'lucide-react'
import AlertModal from './AlertModal'
import PaymentModal from './PaymentModal'
import TransactionStatusModal from './TransactionStatusModal'
import { useToast } from './Toast'

interface PaymentMethod {
    id: number
    name: string
    type: string
    account_number: string
    account_name: string
    image?: string | null
    category?: string
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
    gameId: number
}

export default function TopUpForm({ gameCode, gameName, gameId }: TopUpFormProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [packages, setPackages] = useState<Package[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Check for linked game accounts
    const linkedGameAccounts = user?.gameIds?.filter((g: any) => g.game.code === gameCode) || []
    const [useSavedId, setUseSavedId] = useState(false)

    // Flash Sale Config State
    const [config, setConfig] = useState<any>(null)
    const [isFlashSale, setIsFlashSale] = useState(false)
    const [flashEndTime, setFlashEndTime] = useState(0)

    const [formData, setFormData] = useState({
        user_wa: '',
        id_game: '',
        nickname: '',
        amount_chip: '', // Stored in M
        payment_method_id: '',
        proof_image: '',
        sender_name: '' // Manual input for verification
    })

    // Auto-fill ID & Nickname if linked accounts exist
    useEffect(() => {
        if (linkedGameAccounts.length > 0) {
            setUseSavedId(true)
            setFormData(prev => ({
                ...prev,
                id_game: linkedGameAccounts[0].game_user_id,
                nickname: linkedGameAccounts[0].nickname || ''
            }))
        }
    }, [linkedGameAccounts.length]) // Only run on mount/length change to avoid overwriting user edits if they switch back and forth

    const handleSavedIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        if (val === 'MANUAL') {
            setUseSavedId(false)
            setFormData(prev => ({ ...prev, id_game: '', nickname: '' }))
        } else {
            const selected = linkedGameAccounts.find(g => g.game_user_id === val)
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    id_game: selected.game_user_id,
                    nickname: selected.nickname || ''
                }))
            }
        }
    }

    const [selectedPrice, setSelectedPrice] = useState<number>(0)
    const [manualMode, setManualMode] = useState(false)
    const [promoConfig, setPromoConfig] = useState<{ promoTitle: string, packages: { id: number, name: string, chip: number, price: number }[] } | null>(null)

    useEffect(() => {
        // Fetch Payment Methods with Game Code filter
        fetch(`/api/payment-methods?gameCode=${gameCode}`)
            .then(res => res.json())

            .then((data: PaymentMethod[]) => {
                if (Array.isArray(data)) {
                    // Filter for Deposit Only available methods
                    const filtered = data.filter(pm => !pm.category || pm.category === 'DEPOSIT' || pm.category === 'BOTH')
                    setPaymentMethods(filtered)
                }
            })
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

        // Fetch Config for Flash Sale
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data)
                if (data?.flash_sale?.active && data?.flash_sale?.end_time > Date.now()) {
                    setIsFlashSale(true)
                    setFlashEndTime(data.flash_sale.end_time)
                }
            })
            .catch(err => console.error(err))

        // Fetch Promo Config
        fetch(`/api/promos/public?gameCode=${gameCode}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setPromoConfig(data)
                } else {
                    setPromoConfig(null)
                }
            })
            .catch(err => console.error(err))
    }, [gameCode])

    const { showToast } = useToast()
    const [uploading, setUploading] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Nomor rekening berhasil disalin!', 'success')
        }).catch(() => {
            showToast('Gagal menyalin nomor', 'error')
        })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploading(true)
            // Compress Image Logic
            const reader = new FileReader()
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 800 // Reasonable size for proof
                    const scaleSize = MAX_WIDTH / img.width
                    canvas.width = MAX_WIDTH
                    canvas.height = img.height * scaleSize

                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

                    // Convert to JPEG
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            const formData = new FormData()
                            formData.append('file', blob, 'proof.jpg')

                            try {
                                const res = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                })

                                if (res.ok) {
                                    const data = await res.json()
                                    setFormData(prev => ({ ...prev, proof_image: data.url }))
                                } else {
                                    alert('Gagal upload gambar.')
                                }
                            } catch (err) {
                                console.error(err)
                            } finally {
                                setUploading(false)
                            }
                        }
                    }, 'image/jpeg', 0.7)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const [alertState, setAlertState] = useState<{
        isOpen: boolean
        title: string
        message: string
        type: 'success' | 'error' | 'info'
        onConfirm?: () => void
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info', onConfirm?: () => void) => {
        setAlertState({ isOpen: true, title, message, type, onConfirm })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const selectedPayment = paymentMethods.find(p => p.id === Number(formData.payment_method_id))
        const isQRIS = selectedPayment?.name?.toLowerCase().includes('qris')

        if (!formData.payment_method_id) {
            showAlert('Metode Pembayaran', 'Mohon pilih metode pembayaran terlebih dahulu.', 'error')
            setSubmitting(false)
            return
        }

        // VALIDATION: Min TopUp 10k
        if (selectedPrice < 10000) {
            showAlert('Nominal Kurang', 'Minimal Top Up adalah Rp 10.000.', 'error')
            setSubmitting(false)
            return
        }

        // Check proof if NOT QRIS and NOT User
        if (!formData.proof_image && !isQRIS && !user) {
            showAlert('Bukti Transfer', 'Mohon upload bukti transfer terlebih dahulu.', 'error')
            setSubmitting(false)
            return
        }

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_wa: formData.user_wa,
                    user_id: user?.id,
                    game_id: gameId,
                    user_game_id: formData.id_game,
                    nickname: formData.nickname,
                    amount_chip: Number(formData.amount_chip) / 1000,
                    amount_money: selectedPrice,
                    payment_method_id: formData.payment_method_id,
                    proof_image: formData.proof_image, // Can be empty for QRIS
                    sender_name: formData.sender_name, // Pass the manual sender name
                    type: 'TOPUP'
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (isQRIS) {
                    setCreatedTransaction(data)
                    setShowPaymentModal(true)
                } else {
                    if (user) {
                        // FOR MEMBERS: Show Persistent Status Monitor
                        setCreatedTransaction(data)
                        setShowStatusModal(true)
                        localStorage.setItem('royal_topup_pending_tx', JSON.stringify({ id: data.id, type: 'TOPUP' }))
                    } else {
                        // FOR GUESTS: Regular Alert & Redirect
                        showAlert(
                            'Pesanan Dikirim!',
                            'Mohon tunggu sejenak. Sistem kami sedang memproses pesanan Anda. Jika lebih dari 1 menit belum masuk, silakan hubungi CS.',
                            'success',
                            () => router.push('/check-transaction')
                        )
                    }
                }
            } else {
                showAlert('Gagal Mengirim', 'Maaf, terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.', 'error')
            }
        } catch (error) {
            console.error(error)
            showAlert('Terjadi Kesalahan', 'Ada masalah koneksi. Silakan periksa internet Anda dan coba lagi.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [createdTransaction, setCreatedTransaction] = useState<any>(null)

    // Persistence: Check for pending transaction on mount
    useEffect(() => {
        const pending = localStorage.getItem('royal_topup_pending_tx')
        if (pending) {
            try {
                const { id, type } = JSON.parse(pending)
                if (type === 'TOPUP') {
                    // We just set the ID and show modal. The modal handles polling.
                    setCreatedTransaction({ id })
                    setShowStatusModal(true)
                }
            } catch (e) {
                localStorage.removeItem('royal_topup_pending_tx')
            }
        }
    }, [])

    const handleProofUpload = async (file: File) => {
        // Upload logic here (Reuse upload logic or new)
        const formData = new FormData()
        formData.append('file', file)

        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        })

        if (!uploadRes.ok) throw new Error('Upload Failed')
        const uploadData = await uploadRes.json()

        // Update Transaction
        const updateRes = await fetch(`/api/transactions/${createdTransaction.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                proof_image: uploadData.url
            })
        })

        if (updateRes.ok) {
            setShowPaymentModal(false)
            showAlert(
                'Bukti Terkirim!',
                'Terima kasih! Bukti transfer Anda berhasil dikirim. Sistem akan segera memprosesnya.',
                'success',
                () => router.push('/check-transaction')
            )
        } else {
            throw new Error('Update Failed')
        }
    }

    const selectedPayment = paymentMethods.find(p => p.id === Number(formData.payment_method_id))

    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-10 pb-10">
                {/* Section 1: Data Akun */}
                <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <h3 className="v4-font-syne text-base md:text-xl font-extrabold text-white flex items-center gap-3 mb-8 uppercase tracking-wide md:tracking-widest relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                            <Shield size={20} />
                        </div>
                        1. Data <span className="v4-text-gradient">Akun</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">ID Game</label>
                            {useSavedId && linkedGameAccounts.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <select
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-2xl px-6 py-4 text-white font-black outline-none focus:ring-1 focus:ring-purple-500/50 appearance-none cursor-pointer v4-font-mono"
                                            value={formData.id_game}
                                            onChange={handleSavedIdChange}
                                        >
                                            {linkedGameAccounts.map((acc: any) => (
                                                <option key={acc.id} value={acc.game_user_id}>
                                                    {acc.game_user_id} ({acc.nickname})
                                                </option>
                                            ))}
                                            <option value="MANUAL">+ Gunakan ID Lain (Baru)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">▼</div>
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-tighter text-purple-400 ml-1 flex items-center gap-1.5 bg-purple-500/10 w-fit px-3 py-1 rounded-full border border-purple-500/20">
                                        <Shield size={10} /> ID Tersimpan & Aman
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all v4-font-mono font-medium"
                                        placeholder="Contoh: 12345678"
                                        value={formData.id_game}
                                        onChange={e => setFormData({ ...formData, id_game: e.target.value })}
                                    />
                                    {linkedGameAccounts.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUseSavedId(true)
                                                setFormData(prev => ({
                                                    ...prev,
                                                    id_game: linkedGameAccounts[0].game_user_id,
                                                    nickname: linkedGameAccounts[0].nickname || ''
                                                }))
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest bg-purple-900/50 text-purple-400 px-3 py-2 rounded-xl border border-purple-500/30 hover:bg-purple-900/80 transition-all"
                                        >
                                            Pilih Tersimpan
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nickname</label>
                            {useSavedId && linkedGameAccounts.length > 0 ? (
                                <div className="w-full bg-purple-500/10 border border-purple-500/30 rounded-2xl px-6 py-4 text-purple-400 font-black flex items-center justify-between">
                                    <span className="v4-font-syne text-lg">{formData.nickname}</span>
                                    <span className="text-[9px] font-black bg-purple-500/20 px-3 py-1 rounded-full text-purple-300 flex items-center gap-1 border border-purple-500/30 uppercase tracking-widest">
                                        Verified
                                    </span>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all font-bold uppercase"
                                    placeholder="Contoh: Sultan88"
                                    value={formData.nickname}
                                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                />
                            )}
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">WhatsApp</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all v4-font-mono font-medium"
                                placeholder="08xxxxxxxxxx"
                                value={formData.user_wa}
                                onChange={e => setFormData({ ...formData, user_wa: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-600 font-medium italic ml-1">*Bukti transaksi akan dikirim otomatis ke nomor ini</p>
                        </div>

                        {/* NEW SENDER NAME FIELD FOR GUESTS */}
                        {!user && (
                            <div className="md:col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest ml-1">Nama Rekening Pengirim (Wajib)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-cyan-500/5 border border-cyan-500/30 rounded-2xl px-6 py-4 text-white placeholder-gray-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all font-bold uppercase shadow-[0_0_20px_rgba(34,211,238,0.05)]"
                                    placeholder="Contoh: Budi Santoso"
                                    value={formData.sender_name}
                                    onChange={e => setFormData({ ...formData, sender_name: e.target.value })}
                                />
                                <p className="text-[9px] text-gray-500 font-medium italic ml-1">Masukkkan nama sesuai di M-Banking / E-Wallet Anda agar proses lebih cepat.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 2: Nominal */}
                <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <h3 className="v4-font-syne text-base md:text-xl font-extrabold text-white flex items-center gap-3 mb-10 uppercase tracking-wide md:tracking-widest relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                            <Zap size={20} />
                        </div>
                        {promoConfig ? promoConfig.promoTitle : (
                            <>Pilih <span className="v4-text-gradient">Nominal</span></>
                        )}
                    </h3>

                    {promoConfig && promoConfig.packages.length > 0 ? (
                        <div className="space-y-6 relative z-10">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                {promoConfig.packages.map((pkg) => (
                                        <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, amount_chip: pkg.chip.toString() }))
                                            setSelectedPrice(pkg.price)
                                        }}
                                        className={`relative p-6 rounded-[24px] border transition-all duration-500 text-left group/item overflow-hidden ${Number(formData.amount_chip) === pkg.chip
                                            ? 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500 text-white shadow-xl shadow-cyan-500/20 scale-[1.03]'
                                            : 'bg-black/40 border-white/5 hover:border-cyan-500/30'
                                            }`}
                                    >
                                        <div className="relative z-10">
                                            <p className={`v4-font-syne text-2xl font-black mb-1 ${Number(formData.amount_chip) === pkg.chip ? 'v4-text-gradient' : 'text-gray-400 group-hover/item:text-white'}`}>
                                                {pkg.chip} <span className="text-xs uppercase opacity-70">M</span>
                                            </p>
                                            <p className={`text-xs font-black tracking-widest ${Number(formData.amount_chip) === pkg.chip ? 'text-white' : 'text-gray-600 group-hover/item:text-cyan-400'}`}>
                                                IDR {pkg.price.toLocaleString()}
                                            </p>
                                        </div>
                                        {Number(formData.amount_chip) === pkg.chip && (
                                            <div className="absolute right-0 top-0 p-2 text-cyan-500/10 pointer-events-none">
                                                <Zap size={80} fill="currentColor" />
                                            </div>
                                        )}
                                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-500 rounded-t-full transition-transform duration-500 ${Number(formData.amount_chip) === pkg.chip ? 'scale-x-100' : 'scale-x-0'}`}></div>
                                    </button>
                                ))}
                            </div>
                            {(!formData.amount_chip || Number(formData.amount_chip) === 0) && (
                                <p className="text-[10px] font-black uppercase text-cyan-500 text-center animate-pulse tracking-[0.2em] py-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">🔥 SILAKAN PILIH PAKET PROMO DI ATAS! 🔥</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-4 block">Masukkan Nominal Uang (Rp)</label>
                                <div className="relative group/input">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-black group-focus-within/input:text-cyan-400 transition-colors">Rp</span>
                                    <input
                                        type="number"
                                        className="w-full bg-black/40 border border-white/5 rounded-3xl px-6 py-6 text-white placeholder-gray-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all pl-14 v4-font-mono text-xl font-bold"
                                        placeholder="Min 10.000"
                                        onChange={(e) => {
                                            const money = Number(e.target.value)
                                            setSelectedPrice(money)

                                            let chipsM = 0

                                            // Thresholds for Special Bulk Prices
                                            const flashPrice = config?.flash_sale?.promo_price || 63000
                                            const minAmountB = config?.flash_sale?.min_amount_b || 1
                                            
                                            // Apply Flash Sale Override if active and meets minimum
                                            if (isFlashSale && money >= (flashPrice * minAmountB)) {
                                                chipsM = (money / flashPrice) * 1000
                                            } else if (money >= 3150000) {
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

                                                // Fallback
                                                if (remainingMoney > 0) {
                                                    chipsM += (remainingMoney / 65000) * 1000
                                                }
                                            }

                                            setFormData(prev => ({ ...prev, amount_chip: chipsM.toString() }))
                                        }}
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-cyan-400 opacity-20 group-focus-within/input:opacity-100 transition-opacity">
                                        <Zap size={24} fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                            
                            {isFlashSale && (
                                <div className="mt-4 p-6 bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/20 rounded-[24px] relative overflow-hidden group/flash">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-transparent scale-x-0 group-hover/flash:scale-x-100 transition-transform duration-700" />
                                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                        <div className="bg-red-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-red-500 shrink-0 border border-red-500/30">
                                            <Zap size={24} className="animate-pulse" /> 
                                        </div>
                                        <div>
                                            <p className="v4-font-syne text-red-400 text-sm font-black uppercase tracking-widest mb-1">
                                                ⚡ RUSH HOUR PROMO <span className="text-white opacity-40 mx-2">|</span> S/D {new Date(flashEndTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' })}
                                            </p>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tight">
                                                Dapatkan Harga Rp {(config?.flash_sale?.promo_price || 63000).toLocaleString('id-ID')} / 1B untuk min pembelian {(config?.flash_sale?.min_amount_b || 1)}B.
                                            </p>
                                        </div>
                                    </div>
                                    {Number(formData.amount_chip) >= (config?.flash_sale?.min_amount_b || 1) * 1000 && (
                                        <div className="mt-4 px-4 py-2 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl inline-flex items-center gap-2 border border-green-500/20 animate-in fade-in zoom-in">
                                            <Check size={14} strokeWidth={4} /> Promo Otomatis Aktif!
                                        </div>
                                    )}
                                </div>
                            )}

                            {Number(formData.amount_chip) > 0 && (
                                <div className="p-8 rounded-[32px] bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest pl-1">Anda Mendapatkan:</span>
                                        <span className="v4-font-syne text-3xl font-extrabold text-white block">
                                            {Number(formData.amount_chip) >= 1000
                                                ? <>{(Math.floor((Number(formData.amount_chip) / 1000) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="v4-text-gradient">B</span></>
                                                : <>{Number(formData.amount_chip).toLocaleString()} <span className="v4-text-gradient">M</span></>}
                                        </span>
                                    </div>
                                    <div className="text-center md:text-right bg-white/5 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Bayar:</span>
                                        <span className="text-2xl font-black text-white v4-font-mono">
                                            Rp {selectedPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 3: Pembayaran */}
                <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <h3 className="v4-font-syne text-base md:text-xl font-extrabold text-white flex items-center gap-3 mb-10 uppercase tracking-wide md:tracking-widest relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                            <Wallet size={20} />
                        </div>
                        Pilih <span className="v4-text-gradient">Pembayaran</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                        {paymentMethods.map((pm) => (
                            <button
                                key={pm.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, payment_method_id: pm.id.toString() })}
                                className={`flex items-center justify-between px-8 py-5 rounded-2xl border transition-all duration-500 group/pm overflow-hidden relative ${formData.payment_method_id === pm.id.toString()
                                    ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500 text-white shadow-xl shadow-purple-500/20'
                                    : 'bg-black/40 border-white/5 text-gray-500 hover:border-purple-500/30 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex flex-col items-start relative z-10">
                                    <span className={`text-sm font-black uppercase tracking-widest ${formData.payment_method_id === pm.id.toString() ? 'text-white' : 'text-gray-400'}`}>{pm.name}</span>
                                    <span className="text-[9px] font-bold text-gray-500 group-hover/pm:text-purple-400 transition-colors uppercase mt-1">{pm.type}</span>
                                </div>
                                {formData.payment_method_id === pm.id.toString() && (
                                    <div className="relative z-10 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white animate-in zoom-in duration-300">
                                        <Check size={16} strokeWidth={4} />
                                    </div>
                                )}
                                <div className={`absolute bottom-0 left-0 h-1 bg-purple-500 transition-all duration-500 ${formData.payment_method_id === pm.id.toString() ? 'w-full' : 'w-0'}`}></div>
                            </button>
                        ))}
                    </div>

                    {selectedPayment && (
                        <div className="mt-10 p-10 rounded-[40px] bg-gradient-to-br from-black to-slate-900 border border-white/10 text-center relative overflow-hidden group/box">
                            <div className="absolute inset-0 bg-purple-500/5 group-hover/box:bg-purple-500/10 transition-colors duration-700" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                            
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 relative z-10">Intruksi Pembayaran</p>

                            {selectedPayment.image ? (
                                selectedPayment.name?.toLowerCase().includes('qris') ? (
                                    <div className="flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-500 py-6">
                                        <div className="w-20 h-20 rounded-3xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30 mb-8 animate-pulse shadow-2xl shadow-cyan-500/20">
                                            <Zap size={40} fill="currentColor" />
                                        </div>
                                        <div className="text-center space-y-4 max-w-sm">
                                            <h4 className="v4-font-syne text-2xl font-black text-white uppercase tracking-tight">QRIS Otomatis</h4>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed uppercase tracking-widest opacity-70">
                                                QRIS akan <strong className="text-cyan-400">Muncul Di Layar</strong> setelah Anda menekan tombol konfirmasi di bawah.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-500">
                                        <div className="relative p-4 bg-white rounded-[32px] shadow-2xl mb-8 group-hover/box:scale-105 transition-transform duration-500">
                                        <NextImage
                                                src={selectedPayment.image}
                                                alt="Payment"
                                                width={224}
                                                height={224}
                                                className="w-56 h-auto object-contain rounded-2xl"
                                            />
                                            <div className="absolute -inset-2 bg-purple-500/20 blur-xl opacity-0 group-hover/box:opacity-100 transition-opacity -z-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="v4-font-syne text-xl font-black text-white uppercase tracking-tight">{selectedPayment.name}</p>
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] bg-purple-500/10 px-6 py-2 rounded-full border border-purple-500/20">A/N {selectedPayment.account_name}</p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="relative z-10 animate-in fade-in py-6">
                                    <div className="bg-white/5 border border-white/5 rounded-[32px] px-10 py-8 inline-block shadow-2xl relative group/num">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">No. Rekening / VA</p>
                                        <div className="flex flex-col items-center gap-4">
                                            <p className="v4-font-mono text-lg md:text-2xl lg:text-3xl font-black text-white tracking-widest break-all">
                                                {selectedPayment.account_number}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(selectedPayment.account_number)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    copied ? 'bg-green-500 text-white' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white'
                                                }`}
                                            >
                                                {copied ? <><Check size={12} strokeWidth={4} /> Tersalin!</> : <><Copy size={12} /> Salin Nomor</>}
                                            </button>
                                        </div>
                                        <div className="h-px w-20 bg-purple-500/30 mx-auto my-6" />
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">A/N {selectedPayment.account_name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 4: Upload Bukti */}
                {!selectedPayment?.name?.toLowerCase().includes('qris') && !user && (
                    <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <h3 className="v4-font-syne text-base md:text-xl font-extrabold text-white flex items-center gap-3 mb-10 uppercase tracking-wide md:tracking-widest relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                                <Upload size={20} />
                            </div>
                            Kirim <span className="v4-text-gradient">Bukti Transfer</span>
                        </h3>

                        <div className="border border-white/5 rounded-[32px] p-12 text-center bg-black/40 hover:border-green-500/30 hover:bg-green-500/5 transition-all duration-500 cursor-pointer relative group/upload overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                required={!selectedPayment?.name?.toLowerCase().includes('qris')}
                            />
                            {formData.proof_image ? (
                                <div className="flex flex-col items-center text-green-400 animate-in fade-in zoom-in duration-500 relative z-10">
                                    <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-green-500/20">
                                        <Check className="w-10 h-10" strokeWidth={3} />
                                    </div>
                                    <span className="v4-font-syne text-2xl font-black uppercase tracking-tight">Terupload!</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">Klik untuk ganti bukti</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500 group-hover/upload:text-green-400 transition-all relative z-10">
                                    <div className="w-20 h-20 rounded-[24px] bg-white/5 group-hover/upload:bg-green-500/20 flex items-center justify-center mb-6 transition-all border border-white/5 group-hover/upload:border-green-500/30">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                    <span className="v4-font-syne text-2xl font-black uppercase tracking-tight">Upload Bukti</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">Format: JPG, PNG, JPEG (MAX 5MB)</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-7 v4-btn-main rounded-[32px] font-black text-white shadow-2xl shadow-purple-500/40 transition-all transform hover:-translate-y-2 active:scale-95 disabled:opacity-50 text-lg tracking-[0.3em] uppercase group"
                    >
                        <span className="relative flex items-center justify-center gap-4">
                            {submitting ? 'MEMPROSES...' : selectedPayment?.name?.toLowerCase().includes('qris') ? 'LANJUT PEMBAYARAN' : 'KONFIRMASI PESANAN'}
                            {!submitting && <Zap size={22} fill="currentColor" className="group-hover:animate-bounce" />}
                        </span>
                    </button>
                    <p className="text-center mt-6 text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Sistem otomatis 24 jam • Aman & Terpercaya</p>
                </div>
            </form>

            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
                onConfirm={alertState.onConfirm}
                confirmText={alertState.type === 'success' ? 'Cek Status' : 'Tutup'}
            />

            <PaymentModal
                isOpen={showPaymentModal}
                transaction={createdTransaction}
                onClose={() => {
                    setShowPaymentModal(false)
                    if (user) setShowStatusModal(true)
                }}
                onUploadProof={handleProofUpload}
                isMember={!!user}
            />

            <TransactionStatusModal
                isOpen={showStatusModal}
                transactionId={createdTransaction?.id}
                onClose={() => {
                    setShowStatusModal(false)
                    localStorage.removeItem('royal_topup_pending_tx')
                }}
            />
        </>
    )
}
