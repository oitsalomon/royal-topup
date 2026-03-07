'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Check, AlertTriangle, Shield, Coins, Wallet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import AlertModal from './AlertModal'
import TransactionStatusModal from './TransactionStatusModal'

interface WithdrawMethod {
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
    const { user, isLoading } = useAuth()
    const [withdrawMethods, setWithdrawMethods] = useState<WithdrawMethod[]>([])
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

    const [showStatusModal, setShowStatusModal] = useState(false)
    const [createdTransactionId, setCreatedTransactionId] = useState<number | null>(null)

    // Persistence: Check for pending transaction on mount
    useEffect(() => {
        const pending = localStorage.getItem('royal_topup_pending_tx')
        if (pending) {
            try {
                const { id, type } = JSON.parse(pending)
                if (type === 'WITHDRAW') {
                    setCreatedTransactionId(id)
                    setShowStatusModal(true)
                }
            } catch (e) {
                localStorage.removeItem('royal_topup_pending_tx')
            }
        }
    }, [])


    const [amountB, setAmountB] = useState('')
    const [amountM, setAmountM] = useState('')
    const [config, setConfig] = useState<{ id_wd?: { value: string, nickname: string } } | null>(null)

    // Immediate Auth Check
    useEffect(() => {
        // Give a small delay or check if auth is ready? 
        // useAuth usually has an 'isLoading' or similar? 
        // Assuming 'user' is null if not logged in.

        // We need to wait for auth to INITIALIZE. 
        // If useAuth doesn't expose loading state, we might get false positives on refresh.
        // Let's check if the context exposes loading.

        const timer = setTimeout(() => {
            if (!user) {
                showAlert(
                    'Login Diperlukan',
                    'Mohon maaf untuk WD harap login terlebih dahulu. Apabila belum punya akun harap daftar.',
                    'error',
                    () => router.push('/login')
                )
            }
        }, 1000) // Small delay to allow auth to restore

        return () => clearTimeout(timer)
    }, [user, router])

    useEffect(() => {
        fetch('/api/withdraw-methods')
            .then(res => res.json())
            .then((data: WithdrawMethod[]) => {
                setWithdrawMethods(data)
            })
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

        try {
            const totalM = (Number(amountB) * 1000) + Number(amountM)

            if (totalM <= 0) {
                showAlert('Nominal Kosong', 'Mohon masukkan jumlah chip yang ingin diwithdraw.', 'error')
                setSubmitting(false)
                return
            }

            // VALIDATION: Min Withdraw 500M
            if (totalM < 500) {
                showAlert('Nominal Kurang', 'Minimal Withdraw adalah 500 M.', 'error')
                setSubmitting(false)
                return
            }

            // AUTH CHECK: Require Login (Double Check)
            if (!user) {
                router.push('/login')
                return
            }

            // PROOF CHECK: Skip if Logged In
            if (!formData.proof_image && !user) {
                showAlert('Bukti Kirim Chip', 'Mohon upload bukti kirim chip terlebih dahulu.', 'error')
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
                    user_id: user?.id,
                    game_id: 1,
                    user_game_id: formData.id_game,
                    nickname: formData.nickname,
                    amount_chip: totalM / 1000, // Convert Total M to B for DB
                    amount_money: amount_money,
                    payment_method_id: formData.payment_method_id,
                    proof_image: user ? undefined : formData.proof_image, // Optional if user logged in
                    type: 'WITHDRAW',
                    target_payment_details: target_details
                })
            })

            if (res.ok) {
                const data = await res.json()
                setCreatedTransactionId(data.id)
                setShowStatusModal(true)
                localStorage.setItem('royal_topup_pending_tx', JSON.stringify({ id: data.id, type: 'WITHDRAW' }))
            } else {
                showAlert('Gagal Kirim', 'Gagal mengirim permintaan withdraw. Silakan coba lagi.', 'error')
            }
        } catch (error) {
            console.error(error)
            showAlert('Terjadi Kesalahan', 'Ada masalah koneksi. Silakan coba lagi.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    // Hide content if not logged in (to prevent flashing or interaction)
    // But keep AlertModal visible
    const showContent = !isLoading && user

    return (
        <>
            {showContent ? (
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
                    {/* ... (Existing Form Content - Sections 1, 2, 3, 4) ... */}

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
                    <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Shield size={16} />
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
                    <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Coins size={16} />
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
                            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex justify-between items-center">
                                <span className="text-amber-400 text-sm">Estimasi Uang Diterima:</span>
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
                    <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Wallet size={16} />
                            </div>
                            3. Rekening Penerima
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                            {withdrawMethods.map((wm) => (
                                <button
                                    key={wm.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method_id: wm.id.toString() })}
                                    className={`px-4 py-3 rounded-xl border transition-all duration-300 ${formData.payment_method_id === wm.id.toString()
                                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-amber-500/30'
                                        }`}
                                >
                                    <span className="font-medium">{wm.name}</span>
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

                    {/* Section 4: Bukti Transfer Chip - ONLY IF NOT LOGGED IN */}
                    {!user && (
                        <div className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                            <h3 className="text-xl font-cormorant font-bold text-white flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Upload size={16} />
                                </div>
                                4. Bukti Kirim Chip
                            </h3>

                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    required
                                />
                                {formData.proof_image ? (
                                    <div className="flex flex-col items-center text-emerald-400 animate-in fade-in zoom-in duration-300">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                            <Check className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-lg">Bukti Berhasil Diupload</span>
                                        <span className="text-sm opacity-70 mt-1">Klik untuk mengganti</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-400 transition-colors">
                                        <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-emerald-500/20 flex items-center justify-center mb-4 transition-colors">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-lg">Upload Screenshot Game</span>
                                        <span className="text-sm opacity-50 mt-1">Pastikan ID & Nominal terlihat jelas</span>
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
                        <span className="relative">Kirim Permintaan Withdraw</span>
                    </button>

                </form>
            ) : (
                <div className="h-[50vh] flex items-center justify-center">
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
                    ) : (
                        <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10 max-w-md mx-auto">
                            <Shield size={64} className="mx-auto text-gray-600 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Akses Dibatasi</h3>
                            <p className="text-gray-400 mb-6">Halaman Withdraw khusus untuk member terdaftar.</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-none border border-amber-400 text-black font-bold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all"
                            >
                                Login Sekarang
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
                onConfirm={alertState.onConfirm}
                confirmText={alertState.type === 'success' ? 'Cek Status' : 'Login'}
            />

            <TransactionStatusModal
                isOpen={showStatusModal}
                transactionId={createdTransactionId}
                onClose={() => {
                    setShowStatusModal(false)
                    localStorage.removeItem('royal_topup_pending_tx')
                }}
            />
        </>
    )
}
