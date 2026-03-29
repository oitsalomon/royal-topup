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
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-10 pb-10">
                    
                    {/* Info Transfer Chip */}
                    <div className="v4-glass p-8 rounded-[32px] border border-cyan-500/20 bg-cyan-500/5 flex items-start gap-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400 border border-cyan-500/30 relative z-10">
                            <AlertTriangle size={28} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="v4-font-syne text-cyan-400 font-extrabold text-xl mb-2 uppercase tracking-tight">PENTING! <span className="text-white opacity-40 ml-2">Instruksi Transfer</span></h4>
                            <p className="text-gray-400 font-medium leading-relaxed">
                                Silakan transfer chip ke ID Admin: <span className="v4-font-mono text-white font-black bg-white/10 px-3 py-1 rounded-lg border border-white/10 mx-1">{config?.id_wd?.value || '...'}</span> 
                                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ml-1">{config?.id_wd?.nickname || '...'}</span>
                                <br />
                                <span className="text-[11px] font-bold uppercase tracking-widest opacity-60 mt-2 block">Jangan lupa screenshot bukti transfer chip di dalam game!</span>
                            </p>
                        </div>
                    </div>

                    {/* Section 1: Data Akun */}
                    <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <h3 className="v4-font-syne text-xl font-extrabold text-white flex items-center gap-4 mb-8 uppercase tracking-widest relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                <Shield size={20} />
                            </div>
                            1. Data <span className="v4-text-gradient">Akun Game</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">ID Game</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all v4-font-mono font-medium"
                                    placeholder="ID Game Anda"
                                    value={formData.id_game}
                                    onChange={e => setFormData({ ...formData, id_game: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nickname</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all font-bold uppercase"
                                    placeholder="Nickname"
                                    value={formData.nickname}
                                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                />
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
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Nominal */}
                    <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <h3 className="v4-font-syne text-xl font-extrabold text-white flex items-center gap-4 mb-10 uppercase tracking-widest relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                                <Coins size={20} />
                            </div>
                            2. Nominal <span className="v4-text-gradient">Withdraw</span>
                        </h3>

                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            <div className="relative group/input">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-black group-focus-within/input:text-cyan-400 transition-colors">B</div>
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-white placeholder-gray-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all pl-12 v4-font-mono text-xl font-bold"
                                    placeholder="0"
                                    value={amountB}
                                    onChange={e => setAmountB(e.target.value)}
                                />
                            </div>
                            <div className="relative group/input">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-black group-focus-within/input:text-purple-400 transition-colors">M</div>
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-white placeholder-gray-700 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all pl-12 v4-font-mono text-xl font-bold"
                                    placeholder="0"
                                    value={amountM}
                                    onChange={e => setAmountM(e.target.value)}
                                />
                            </div>
                        </div>

                        {(amountB || amountM) && (
                            <div className="mt-8 p-8 rounded-[32px] bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500 relative z-10">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest pl-1">Estimasi Uang Diterima:</span>
                                    <span className="v4-font-syne text-5xl font-extrabold text-white block">
                                        Rp {(() => {
                                            const totalM = (Number(amountB) * 1000) + Number(amountM)
                                            if (totalM === 500) return (25000).toLocaleString()
                                            return ((totalM / 1000) * 60000).toLocaleString()
                                        })()}
                                    </span>
                                </div>
                                <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Status WD:</span>
                                    <span className="text-xs font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Open Sekarang
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Rekening Penerima */}
                    <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <h3 className="v4-font-syne text-xl font-extrabold text-white flex items-center gap-4 mb-10 uppercase tracking-widest relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                <Wallet size={20} />
                            </div>
                            Pilih <span className="v4-text-gradient">Metode WD</span>
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-10 relative z-10">
                            {withdrawMethods.map((wm) => (
                                <button
                                    key={wm.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method_id: wm.id.toString() })}
                                    className={`px-6 py-4 rounded-2xl border transition-all duration-500 group/pm relative overflow-hidden ${formData.payment_method_id === wm.id.toString()
                                        ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500 text-white shadow-xl shadow-purple-500/20'
                                        : 'bg-black/40 border-white/5 text-gray-500 hover:border-purple-500/30 hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`text-xs font-black uppercase tracking-widest relative z-10 ${formData.payment_method_id === wm.id.toString() ? 'text-white' : 'text-gray-500'}`}>{wm.name}</span>
                                    <div className={`absolute bottom-0 left-0 h-1 bg-purple-500 transition-all duration-500 ${formData.payment_method_id === wm.id.toString() ? 'w-full' : 'w-0'}`}></div>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">No. Rekening / E-Wallet</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all v4-font-mono font-medium"
                                    placeholder="Contoh: 1234567890"
                                    value={formData.target_account_number}
                                    onChange={e => setFormData({ ...formData, target_account_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Atas Nama</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all font-bold uppercase"
                                    placeholder="Nama Pemilik Rekening"
                                    value={formData.target_account_name}
                                    onChange={e => setFormData({ ...formData, target_account_name: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Bukti Transfer Chip */}
                    {!user && (
                        <div className="v4-glass p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <h3 className="v4-font-syne text-xl font-extrabold text-white flex items-center gap-4 mb-10 uppercase tracking-widest relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                                    <Upload size={20} />
                                </div>
                                Bukti <span className="v4-text-gradient">Kirim Chip</span>
                            </h3>

                            <div className="border border-white/5 rounded-[32px] p-12 text-center bg-black/40 hover:border-green-500/30 hover:bg-green-500/5 transition-all duration-500 cursor-pointer relative group/upload overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    required
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
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">Screenshot Game (Max 5MB)</span>
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
                                {submitting ? 'MEMPROSES...' : 'KIRIM PERMINTAAN WITHDRAW'}
                                {!submitting && <Shield size={22} className="group-hover:animate-bounce" />}
                            </span>
                        </button>
                    </div>

                </form>
            ) : (
                <div className="h-[50vh] flex items-center justify-center p-6">
                    {isLoading ? (
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 opacity-50" size={24} />
                        </div>
                    ) : (
                        <div className="v4-glass p-12 rounded-[40px] border border-white/10 max-w-md mx-auto text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="w-24 h-24 rounded-[32px] bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30 mx-auto mb-8 shadow-2xl relative z-10">
                                <Shield size={48} />
                            </div>
                            <h3 className="v4-font-syne text-3xl font-black text-white mb-4 uppercase tracking-tight relative z-10">Batas <span className="v4-text-gradient">Akses!</span></h3>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-10 relative z-10">Halaman Withdraw khusus untuk member VIP terdaftar.</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-5 v4-btn-main rounded-2xl font-black text-white text-xs tracking-[0.2em] uppercase relative z-10"
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
