'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { Upload, Check, AlertCircle, Shield, Zap, Wallet } from 'lucide-react'
import AlertModal from './AlertModal'
import PaymentModal from './PaymentModal'
import TransactionStatusModal from './TransactionStatusModal'

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

    const [formData, setFormData] = useState({
        user_wa: '',
        id_game: '',
        nickname: '',
        amount_chip: '', // Stored in M
        payment_method_id: '',
        proof_image: ''
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

    const [uploading, setUploading] = useState(false)

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
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
                {/* ... (Existing Form Content) ... */}

                {/* Section 1: Data Akun */}
                <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Shield size={16} />
                        </div>
                        1. Masukkan Data Akun
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 ml-1">ID Game</label>
                            {useSavedId && linkedGameAccounts.length > 0 ? (
                                <div className="space-y-2">
                                    <select
                                        className="w-full bg-[#161b22] border border-cyan-500/50 rounded-xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
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
                                    <p className="text-xs text-cyan-400 ml-1 flex items-center gap-1">
                                        <Shield size={12} /> ID Tersimpan
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
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
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-cyan-900/50 text-cyan-400 px-3 py-1.5 rounded-lg hover:bg-cyan-900/80 transition-colors"
                                        >
                                            Pilih ID Tersimpan
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 ml-1">Nickname</label>
                            {useSavedId && linkedGameAccounts.length > 0 ? (
                                <div className="w-full bg-cyan-900/20 border border-cyan-500/50 rounded-xl px-5 py-4 text-cyan-400 font-bold flex items-center justify-between">
                                    <span>{formData.nickname}</span>
                                    <span className="text-xs bg-cyan-500/20 px-2 py-1 rounded text-cyan-300 flex items-center gap-1">
                                        <Shield size={12} /> Terverifikasi
                                    </span>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                    placeholder="Contoh: Sultan88"
                                    value={formData.nickname}
                                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                />
                            )}
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
                <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Zap size={16} />
                        </div>
                        {promoConfig ? promoConfig.promoTitle : '2. Masukkan Nominal Top Up'}
                    </h3>

                    {promoConfig && promoConfig.packages.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {promoConfig.packages.map((pkg) => (
                                        <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, amount_chip: pkg.chip.toString() }))
                                            setSelectedPrice(pkg.price)
                                        }}
                                        className={`relative p-4 rounded-xl border transition-all duration-300 text-left group overflow-hidden ${Number(formData.amount_chip) === pkg.chip
                                            ? 'bg-amber-950/40 border-amber-500 text-white shadow-[0_0_15px_rgba(251,191,36,0.2)] transform scale-105'
                                            : 'bg-black/40 border-white/5 hover:border-amber-500/30'
                                            }`}
                                    >
                                        <div className="relative z-10">
                                            <p className={`text-lg font-bold mb-1 ${Number(formData.amount_chip) === pkg.chip ? 'text-amber-400' : 'text-gray-300'}`}>
                                                {pkg.chip} M
                                            </p>
                                            <p className={`text-sm ${Number(formData.amount_chip) === pkg.chip ? 'text-white/90' : 'text-gray-500'}`}>
                                                Rp {pkg.price.toLocaleString()}
                                            </p>
                                        </div>
                                        {Number(formData.amount_chip) === pkg.chip && (
                                            <div className="absolute right-0 top-0 p-2 text-amber-500/20">
                                                <Zap size={40} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {(!formData.amount_chip || Number(formData.amount_chip) === 0) && (
                                <p className="text-sm text-yellow-500 text-center animate-pulse">🔥 Silakan pilih paket promo di atas!</p>
                            )}
                        </div>
                    ) : (
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

                                                // Fallback
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
                    )}
                </div>

                {/* Section 3: Pembayaran */}
                <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Wallet size={16} />
                        </div>
                        3. Metode Pembayaran
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paymentMethods.map((pm) => (
                            <button
                                key={pm.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, payment_method_id: pm.id.toString() })}
                                className={`flex items-center justify-between px-6 py-4 rounded-xl border transition-all duration-200 ${formData.payment_method_id === pm.id.toString()
                                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                                    : 'bg-black/40 border-white/5 text-gray-400 hover:border-amber-500/30'
                                    }`}
                            >
                                <span className="font-bold">{pm.name}</span>
                                <span className={`text-xs px-2 py-1 rounded ${formData.payment_method_id === pm.id.toString() ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5'
                                    }`}>{pm.type}</span>
                            </button>
                        ))}
                    </div>

                    {selectedPayment && (
                        <div className="mt-6 p-6 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                            <p className="text-sm text-gray-400 mb-4 relative z-10">Silakan transfer / scan ke:</p>

                            {selectedPayment.image ? (
                                selectedPayment.name?.toLowerCase().includes('qris') ? (
                                    <div className="flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-300 py-4">
                                        <div className="bg-white/10 p-4 rounded-full mb-4">
                                            <Zap size={40} className="text-yellow-400 animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-2 max-w-sm">
                                            <h4 className="text-lg font-bold text-white">Langkah Selanjutnya</h4>
                                            <p className="text-sm text-gray-300 leading-relaxed">
                                                QRIS akan <strong>Pop-Up</strong> di layar Anda setelah klik tombol <strong className="text-cyan-400">Lanjut Pembayaran</strong>.
                                                <br />Harap scan QRIS tersebut untuk menyelesaikan pembayaran.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-300">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={selectedPayment.image}
                                            alt="Payment"
                                            className="w-56 h-auto object-contain rounded-xl border-4 border-white shadow-2xl mb-4"
                                        />
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold text-white">{selectedPayment.name}</p>
                                            <p className="text-sm text-purple-400">A/N {selectedPayment.account_name}</p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="relative z-10 animate-in fade-in">
                                    <p className="text-3xl font-bold text-white tracking-wider mb-1 font-mono">{selectedPayment.account_number}</p>
                                    <p className="text-sm text-purple-400">A/N {selectedPayment.account_name}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 4: Upload Bukti - Only show if NOT QRIS and NOT User */}
                {!selectedPayment?.name?.toLowerCase().includes('qris') && !user && (
                    <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Upload size={16} />
                            </div>
                            4. Upload Bukti Transfer
                        </h3>

                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                required={!selectedPayment?.name?.toLowerCase().includes('qris')}
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
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold uppercase tracking-widest text-sm py-5 rounded-none border border-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all transform hover:-translate-y-1 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center justify-center gap-2">
                        {submitting ? 'Sedang Memproses...' : selectedPayment?.name?.toLowerCase().includes('qris') ? 'Lanjut Pembayaran' : 'Kirim Pesanan Sekarang'}
                        {!submitting && <Zap size={18} fill="currentColor" />}
                    </span>
                </button>
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
