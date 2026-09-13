'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Clock,
    Copy,
    Check,
    Upload,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    FileText,
    ExternalLink,
    ShieldCheck,
    AlertCircle,
    UserCheck,
    Building2,
    Coins,
    ChevronDown,
    Search,
    Smartphone,
    Wallet,
    X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import dynamic from 'next/dynamic'

const TransactionStatusModal = dynamic(() => import('./TransactionStatusModal'), { ssr: false })

interface WithdrawMethod {
    id: number
    name: string
    type: string
}

interface WithdrawFormProps {
    gameCode: string
    gameName: string
}

// Opsi chip cepat standar pasar
const QUICK_CHIP_OPTIONS = [
    { label: '500M', m: 500, b: 0.5, estMoney: 25000 },
    { label: '1B', m: 1000, b: 1, estMoney: 60000, isPopular: true },
    { label: '2B', m: 2000, b: 2, estMoney: 120000 },
    { label: '3B', m: 3000, b: 3, estMoney: 180000 },
    { label: '5B', m: 5000, b: 5, estMoney: 300000, isPopular: true },
    { label: '10B', m: 10000, b: 10, estMoney: 600000 },
    { label: '20B', m: 20000, b: 20, estMoney: 1200000 },
    { label: '50B', m: 50000, b: 50, estMoney: 3000000 },
]

const DEFAULT_BANKS: WithdrawMethod[] = [
    { id: 1, name: 'BCA', type: 'BANK' },
    { id: 2, name: 'MANDIRI', type: 'BANK' },
    { id: 3, name: 'BRI', type: 'BANK' },
    { id: 4, name: 'BNI', type: 'BANK' },
    { id: 23, name: 'SEABANK', type: 'BANK_DIGITAL' },
    { id: 33, name: 'DANA', type: 'EWALLET' },
    { id: 34, name: 'GOPAY', type: 'EWALLET' },
    { id: 35, name: 'OVO', type: 'EWALLET' },
    { id: 36, name: 'SHOPEEPAY', type: 'EWALLET' },
]

export default function WithdrawForm({ gameCode, gameName }: WithdrawFormProps) {
    const router = useRouter()
    const { user } = useAuth()

    // Step state: 1 = Form Input, 2 = Akun Penampung & Bukti, 3 = Sukses/Tracking
    const [step, setStep] = useState<1 | 2>(1)

    // Form inputs
    const [userIdGame, setUserIdGame] = useState('')
    const [nickname, setNickname] = useState('')
    const [userWa, setUserWa] = useState('')
    const [selectedChipM, setSelectedChipM] = useState<number>(1000) // Default 1B
    const [customChipB, setCustomChipB] = useState<string>('')
    const [isCustom, setIsCustom] = useState(false)

    // Bank pencairan & Searchable Combobox
    const [withdrawMethods, setWithdrawMethods] = useState<WithdrawMethod[]>(DEFAULT_BANKS)
    const [selectedBank, setSelectedBank] = useState<string>('BCA')
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(1)
    const [searchBankQuery, setSearchBankQuery] = useState<string>('')
    const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
    const comboboxRef = useRef<HTMLDivElement>(null)

    const [accountNumber, setAccountNumber] = useState('')
    const [accountName, setAccountName] = useState('')

    // Biaya Admin Guest (diambil dinamis dari database/settings via /api/config)
    const [guestFee, setGuestFee] = useState<number>(2500)

    // Bukti kirim koin
    const [proofImage, setProofImage] = useState<string>('')
    const [uploadingProof, setUploadingProof] = useState(false)

    // Config akun penampung admin
    const [adminTargetAccount, setAdminTargetAccount] = useState({
        id: '24761608',
        nickname: 'CLOVER_OFFICIAL'
    })

    // Transaction & Status modal states
    const [submitting, setSubmitting] = useState(false)
    const [createdTxId, setCreatedTxId] = useState<number | null>(null)
    const [showStatusModal, setShowStatusModal] = useState(false)

    // Timer countdown untuk Step 2 (10 menit)
    const [timeLeft, setTimeLeft] = useState(600)
    const [copiedAdminId, setCopiedAdminId] = useState(false)

    // Auto-fill jika member login
    useEffect(() => {
        if (user) {
            if ((user as any).bank_name) {
                const bName = (user as any).bank_name
                setSelectedBank(bName)
                const found = withdrawMethods.find(m => m.name.toLowerCase() === bName.toLowerCase())
                if (found) setSelectedMethodId(found.id)
            }
            if ((user as any).account_number) setAccountNumber((user as any).account_number)
            if ((user as any).account_name) setAccountName((user as any).account_name)
            if ((user as any).user_wa) setUserWa((user as any).user_wa)
        }
    }, [user, withdrawMethods])

    // Fetch config & withdraw methods
    useEffect(() => {
        fetch('/api/withdraw-methods')
            .then(res => res.json())
            .then((data: WithdrawMethod[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    setWithdrawMethods(data)
                    const found = data.find(m => m.name.toLowerCase() === selectedBank.toLowerCase())
                    if (found) {
                        setSelectedMethodId(found.id)
                    } else if (data[0]) {
                        setSelectedBank(data[0].name)
                        setSelectedMethodId(data[0].id)
                    }
                }
            })
            .catch(() => {})

        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data?.id_wd?.value) {
                    setAdminTargetAccount({
                        id: data.id_wd.value,
                        nickname: data.id_wd.nickname || 'ADMIN_PENAMPUNG'
                    })
                }
                if (typeof data?.guest_withdraw_fee === 'number') {
                    setGuestFee(data.guest_withdraw_fee)
                }
            })
            .catch(() => {})
    }, [])

    // Tutup dropdown combobox saat klik di luar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
                setIsBankDropdownOpen(false)
                setSearchBankQuery('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [])

    // Kalkulasi Total Koin & Uang Bersih
    const totalM = isCustom ? (Number(customChipB) || 0) * 1000 : selectedChipM
    const totalB = totalM / 1000

    // Biaya Admin: Member Rp 0 (Bebas Fee) vs Guest diambil dari DB (default Rp 2.500)
    const adminFee = user ? 0 : guestFee

    // Estimasi harga koin (500M = 25rb, 1B = 60rb)
    const grossMoney = useMemo(() => {
        if (totalM <= 0) return 0
        if (totalM === 500) return 25000
        return (totalM / 1000) * 60000
    }, [totalM])

    const netMoney = useMemo(() => {
        if (grossMoney <= 0) return 0
        return Math.max(0, grossMoney - adminFee)
    }, [grossMoney, adminFee])

    // Deteksi tipe metode pencairan terpilih
    const currentMethodObj = useMemo(() => {
        return withdrawMethods.find(m => m.name.toLowerCase() === selectedBank.toLowerCase())
    }, [withdrawMethods, selectedBank])

    const isEwallet = useMemo(() => {
        if (currentMethodObj) return currentMethodObj.type === 'EWALLET'
        return ['DANA', 'GOPAY', 'OVO', 'SHOPEEPAY', 'LINKAJA', 'ASTRAPAY', 'I.SAKU', 'SAKUKU'].includes(selectedBank.toUpperCase())
    }, [currentMethodObj, selectedBank])

    // Filter daftar bank untuk combobox
    const filteredMethods = useMemo(() => {
        const q = searchBankQuery.trim().toLowerCase()
        if (!q) return withdrawMethods
        return withdrawMethods.filter(m =>
            m.name.toLowerCase().includes(q) ||
            (m.type === 'BANK' && 'bank konvensional'.includes(q)) ||
            (m.type === 'BANK_DIGITAL' && 'bank digital'.includes(q)) ||
            (m.type === 'EWALLET' && 'ewallet e-wallet dompet digital'.includes(q))
        )
    }, [withdrawMethods, searchBankQuery])

    const bankKonvensionalList = useMemo(() => filteredMethods.filter(m => m.type === 'BANK'), [filteredMethods])
    const bankDigitalList = useMemo(() => filteredMethods.filter(m => m.type === 'BANK_DIGITAL'), [filteredMethods])
    const ewalletList = useMemo(() => filteredMethods.filter(m => m.type === 'EWALLET'), [filteredMethods])

    // Validasi format nomor rekening / e-wallet
    const cleanAccountNumber = accountNumber.replace(/[\s-]/g, '')
    const ewalletRegex = /^(?:(?:\+|00)?62|0)[8][0-9]{8,12}$/
    const bankRegex = /^[0-9]{8,20}$/

    const accountNumberValidation = useMemo(() => {
        if (!cleanAccountNumber) return { isValid: false, message: '' }
        if (isEwallet) {
            const valid = ewalletRegex.test(cleanAccountNumber)
            return {
                isValid: valid,
                message: valid
                    ? 'Format nomor e-wallet valid'
                    : 'Nomor e-wallet tidak valid. Gunakan format nomor HP 08xx/62xx (10–14 digit).'
            }
        } else {
            const valid = bankRegex.test(cleanAccountNumber)
            return {
                isValid: valid,
                message: valid
                    ? 'Format nomor rekening valid'
                    : 'Nomor rekening tidak valid. Masukkan 8–20 digit angka tanpa spasi atau simbol.'
            }
        }
    }, [cleanAccountNumber, isEwallet])

    // Countdown timer di Step 2
    useEffect(() => {
        if (step !== 2) return
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [step])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const formatRupiah = (val: number) => {
        return 'Rp ' + Number(val).toLocaleString('id-ID')
    }

    // Handle Upload Bukti
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingProof(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            if (res.ok) {
                const data = await res.json()
                setProofImage(data.url)
            } else {
                alert('Gagal mengunggah gambar. Pastikan format JPG/PNG di bawah 5MB.')
            }
        } catch {
            alert('Terjadi kendala jaringan saat upload.')
        } finally {
            setUploadingProof(false)
        }
    }

    // Step 1 -> Step 2
    const handleProceedToStep2 = (e: React.FormEvent) => {
        e.preventDefault()

        if (!userIdGame.trim()) {
            alert('Silakan masukkan User ID Game.')
            return
        }
        if (totalM < 500) {
            alert('Minimal penarikan adalah 500M chip.')
            return
        }
        if (!accountNumber.trim() || !accountName.trim()) {
            alert('Silakan isi nomor dan nama pemilik rekening pencairan.')
            return
        }

        // Cek validasi format nomor rekening / e-wallet
        if (isEwallet && !ewalletRegex.test(cleanAccountNumber)) {
            alert('Nomor e-wallet tidak valid. Gunakan format nomor HP 08xx/62xx (10–14 digit angka).')
            return
        }
        if (!isEwallet && !bankRegex.test(cleanAccountNumber)) {
            alert('Nomor rekening bank tidak valid. Masukkan 8–20 digit angka tanpa spasi atau karakter lain.')
            return
        }

        setTimeLeft(600) // Reset 10 menit
        setStep(2)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Final Submit di Step 2
    const handleFinalSubmit = async () => {
        if (!proofImage) {
            alert('Silakan unggah foto bukti pengiriman chip ke akun admin terlebih dahulu.')
            return
        }

        setSubmitting(true)
        try {
            const methodIdToPass = selectedMethodId || currentMethodObj?.id || null
            const payload = {
                user_wa: userWa || '081200000000',
                user_id: user?.id || null,
                game_id: 1,
                user_game_id: userIdGame.trim(),
                nickname: nickname.trim() || 'Pemain',
                amount_chip: totalB,
                amount_money: netMoney,
                payment_method_id: methodIdToPass,
                target_payment_details: `${selectedBank} - ${cleanAccountNumber} (${accountName.trim()})`,
                proof_image: proofImage,
                sender_name: accountName.trim(),
                type: 'WITHDRAW'
            }

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const txData = await res.json()
                setCreatedTxId(txData.id)
                setShowStatusModal(true)
                localStorage.setItem('royal_topup_pending_tx', JSON.stringify({ id: txData.id, type: 'WITHDRAW' }))
            } else {
                const err = await res.json().catch(() => ({}))
                alert(err.error || 'Gagal mengirimkan permintaan bongkar. Silakan hubungi admin.')
            }
        } catch {
            alert('Terjadi kesalahan koneksi. Silakan coba kembali.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="w-full space-y-5 pb-16 font-inter text-[#f3ecd8]">
            
            {/* Action Bar: Cek Bongkaran & CS */}
            <div className="bg-[#17171a] border border-[#8a6d38]/30 rounded-lg p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <Link
                    href={`/preview-topup/${gameCode || 'royal-dream'}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0d0d0f] hover:bg-[#17171a] text-[#f3ecd8] text-xs font-poppins font-semibold border border-[#8a6d38]/40 hover:border-[#c5a369] transition-colors"
                >
                    <ArrowLeft size={13} className="text-[#c5a369]" />
                    <span>Halaman Top Up (Beli)</span>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (createdTxId) {
                                setShowStatusModal(true)
                            } else {
                                router.push('/check-transaction')
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0d0d0f] hover:bg-[#17171a] text-[#f3ecd8] text-xs font-poppins font-medium border border-[#8a6d38]/40 hover:border-[#c5a369] transition-colors"
                    >
                        <FileText size={13} className="text-[#c5a369]" />
                        <span>Riwayat Bongkaran</span>
                    </button>

                    <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#0d0d0f] hover:bg-[#17171a] text-[#a89f8a] hover:text-[#f3ecd8] text-xs border border-[#8a6d38]/30 transition-colors"
                    >
                        <span>CS Bantuan</span>
                        <ExternalLink size={11} className="text-[#c5a369]" />
                    </a>
                </div>
            </div>

            {/* Banner Status Member vs Guest */}
            {user ? (
                <div className="bg-[#17171a] border border-[#3fa46a]/60 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <UserCheck size={18} className="text-[#3fa46a]" />
                        <div>
                            <p className="font-poppins font-bold text-[#f3ecd8]">Status Akun: Member Terdaftar ({user.username})</p>
                            <p className="text-[#3fa46a] text-[11px]">Anda mendapatkan keuntungan <span className="font-bold underline">GRATIS Biaya Admin (Fee Rp 0)</span>.</p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#3fa46a] text-white text-[10px] font-poppins font-semibold">
                        Bebas Fee Rp 0
                    </span>
                </div>
            ) : (
                <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                        <p className="font-poppins font-bold text-[#f3ecd8]">Bongkar Sebagai Tamu (Biaya Admin {formatRupiah(guestFee)})</p>
                        <p className="text-[#a89f8a] text-[11px]">
                            Mau bebas biaya admin? <Link href="/login" className="text-[#c5a369] font-semibold underline hover:text-[#e8c883]">Login</Link> atau <Link href="/register" className="text-[#c5a369] font-semibold underline hover:text-[#e8c883]">Daftar Member</Link> untuk nikmati <span className="text-[#3fa46a] font-bold">Fee Rp 0</span>.
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="px-3.5 py-1.5 rounded-md bg-[#3fa46a] hover:bg-[#358a59] text-white font-poppins font-semibold text-xs transition-colors"
                    >
                        Login Member
                    </Link>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: INPUT DATA BONGKAR                                                */}
            {/* ========================================================================= */}
            {step === 1 && (
                <form onSubmit={handleProceedToStep2} className="space-y-5">
                    
                    {/* 1. Data Akun Game */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 space-y-4">
                        <div className="pb-3 border-b border-[#8a6d38]/20">
                            <h2 className="font-poppins font-bold text-sm text-[#f3ecd8] uppercase tracking-wide">
                                1. Data Akun Game Pengirim
                            </h2>
                            <p className="text-xs text-[#a89f8a] mt-0.5">
                                Akun game yang akan Anda gunakan untuk mentransfer chip ke admin
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    User ID Game <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: 24761608"
                                    value={userIdGame}
                                    onChange={e => setUserIdGame(e.target.value)}
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2 text-sm text-[#f3ecd8] font-mono outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Nickname Akun
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Sultan88"
                                    value={nickname}
                                    onChange={e => setNickname(e.target.value)}
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2 text-sm text-[#f3ecd8] outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Nomor WhatsApp <span className="text-[#8a6d38] text-[10px]">(Notifikasi Cair)</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="08xxxxxxxxxx"
                                    value={userWa}
                                    onChange={e => setUserWa(e.target.value)}
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2 text-sm text-[#f3ecd8] font-mono outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Jumlah Chip Yang Mau Dibongkar */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#8a6d38]/20">
                            <div>
                                <h2 className="font-poppins font-bold text-sm text-[#f3ecd8] uppercase tracking-wide">
                                    2. Jumlah Koin / Chip Yang Dibongkar
                                </h2>
                                <p className="text-xs text-[#a89f8a] mt-0.5">
                                    Rate: Rp 60.000 / 1B (Minimal penarikan 500M = Rp 25.000)
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCustom(!isCustom)}
                                className="text-xs text-[#c5a369] hover:text-[#e8c883] underline font-medium"
                            >
                                {isCustom ? 'Pilih Paket Standar' : 'Ketik Nominal Bebas'}
                            </button>
                        </div>

                        {!isCustom ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {QUICK_CHIP_OPTIONS.map(opt => {
                                    const isSelected = selectedChipM === opt.m
                                    return (
                                        <button
                                            key={opt.m}
                                            type="button"
                                            onClick={() => setSelectedChipM(opt.m)}
                                            className={`text-left p-3 rounded-md border transition-all ${
                                                isSelected
                                                    ? 'bg-[#17171a] border-2 border-[#c5a369] shadow-sm'
                                                    : 'bg-[#0d0d0f] border-[#8a6d38]/30 hover:border-[#8a6d38]'
                                            }`}
                                        >
                                            <p className={`text-base font-poppins font-bold ${isSelected ? 'text-[#e8c883]' : 'text-[#f3ecd8]'}`}>{opt.label}</p>
                                            <p className="text-xs font-semibold text-[#3fa46a] font-mono mt-1">
                                                {formatRupiah(opt.estMoney)}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Masukkan Jumlah Chip (dalam satuan B):
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.5"
                                    placeholder="Contoh: 1.5 atau 3"
                                    value={customChipB}
                                    onChange={e => setCustomChipB(e.target.value)}
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2 text-sm text-[#f3ecd8] font-mono outline-none"
                                />
                                <p className="text-[11px] text-[#a89f8a] mt-1">
                                    Contoh: Ketik 1 untuk 1B, atau 2.5 untuk 2.5B.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 3. Rekening Tujuan Pencairan Uang */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 space-y-4">
                        <div className="pb-3 border-b border-[#8a6d38]/20">
                            <h2 className="font-poppins font-bold text-sm text-[#f3ecd8] uppercase tracking-wide">
                                3. Rekening Tujuan Pencairan Uang
                            </h2>
                            <p className="text-xs text-[#a89f8a] mt-0.5">
                                Uang hasil bongkar akan ditransfer langsung ke rekening atau e-wallet ini
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {/* Searchable Combobox Bank / E-Wallet */}
                            <div className="relative" ref={comboboxRef}>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Bank / E-Wallet <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={isBankDropdownOpen ? searchBankQuery : selectedBank}
                                        placeholder="Ketik nama bank/e-wallet..."
                                        onFocus={() => {
                                            setIsBankDropdownOpen(true)
                                            setSearchBankQuery('')
                                        }}
                                        onChange={e => {
                                            setSearchBankQuery(e.target.value)
                                            if (!isBankDropdownOpen) setIsBankDropdownOpen(true)
                                        }}
                                        className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md pl-3 pr-8 py-2 text-xs font-inter text-[#f3ecd8] outline-none transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsBankDropdownOpen(prev => !prev)
                                            if (!isBankDropdownOpen) setSearchBankQuery('')
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c5a369] hover:text-[#e8c883]"
                                        tabIndex={-1}
                                    >
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {/* Dropdown List with Visual Categories */}
                                {isBankDropdownOpen && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-[#131417] border border-[#8a6d38]/60 rounded-md shadow-2xl max-h-64 overflow-y-auto divide-y divide-[#8a6d38]/20 animate-in fade-in zoom-in-95 duration-150">
                                        {filteredMethods.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-[#a89f8a]">
                                                Metode tidak ditemukan untuk &quot;{searchBankQuery}&quot;
                                            </div>
                                        ) : (
                                            <>
                                                {/* Group 1: Bank Konvensional */}
                                                {bankKonvensionalList.length > 0 && (
                                                    <div className="p-1.5">
                                                        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#0d0d0f]/60 rounded">
                                                            <span className="flex items-center gap-1.5">
                                                                <Building2 size={12} strokeWidth={1.5} />
                                                                Bank Konvensional
                                                            </span>
                                                            <span className="text-[9px] text-[#a89f8a] font-mono">({bankKonvensionalList.length})</span>
                                                        </div>
                                                        <div className="mt-1 space-y-0.5">
                                                            {bankKonvensionalList.map(item => {
                                                                const isSelected = selectedBank.toUpperCase() === item.name.toUpperCase()
                                                                return (
                                                                    <button
                                                                        key={item.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedBank(item.name)
                                                                            setSelectedMethodId(item.id)
                                                                            setSearchBankQuery('')
                                                                            setIsBankDropdownOpen(false)
                                                                        }}
                                                                        className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between transition-colors ${
                                                                            isSelected
                                                                                ? 'bg-[#8a6d38]/30 text-[#e8c883] font-semibold'
                                                                                : 'text-[#f3ecd8] hover:bg-[#1a1b20]'
                                                                        }`}
                                                                    >
                                                                        <span>{item.name}</span>
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0d0d0f] border border-[#8a6d38]/30 text-[#a89f8a]">
                                                                            Bank
                                                                        </span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Group 2: Bank Digital */}
                                                {bankDigitalList.length > 0 && (
                                                    <div className="p-1.5">
                                                        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#0d0d0f]/60 rounded">
                                                            <span className="flex items-center gap-1.5">
                                                                <Smartphone size={12} strokeWidth={1.5} />
                                                                Bank Digital
                                                            </span>
                                                            <span className="text-[9px] text-[#a89f8a] font-mono">({bankDigitalList.length})</span>
                                                        </div>
                                                        <div className="mt-1 space-y-0.5">
                                                            {bankDigitalList.map(item => {
                                                                const isSelected = selectedBank.toUpperCase() === item.name.toUpperCase()
                                                                return (
                                                                    <button
                                                                        key={item.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedBank(item.name)
                                                                            setSelectedMethodId(item.id)
                                                                            setSearchBankQuery('')
                                                                            setIsBankDropdownOpen(false)
                                                                        }}
                                                                        className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between transition-colors ${
                                                                            isSelected
                                                                                ? 'bg-[#8a6d38]/30 text-[#e8c883] font-semibold'
                                                                                : 'text-[#f3ecd8] hover:bg-[#1a1b20]'
                                                                        }`}
                                                                    >
                                                                        <span>{item.name}</span>
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0d0d0f] border border-[#8a6d38]/30 text-[#3fa46a]">
                                                                            Digital
                                                                        </span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Group 3: E-Wallet */}
                                                {ewalletList.length > 0 && (
                                                    <div className="p-1.5">
                                                        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#0d0d0f]/60 rounded">
                                                            <span className="flex items-center gap-1.5">
                                                                <Wallet size={12} strokeWidth={1.5} />
                                                                E-Wallet
                                                            </span>
                                                            <span className="text-[9px] text-[#a89f8a] font-mono">({ewalletList.length})</span>
                                                        </div>
                                                        <div className="mt-1 space-y-0.5">
                                                            {ewalletList.map(item => {
                                                                const isSelected = selectedBank.toUpperCase() === item.name.toUpperCase()
                                                                return (
                                                                    <button
                                                                        key={item.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedBank(item.name)
                                                                            setSelectedMethodId(item.id)
                                                                            setSearchBankQuery('')
                                                                            setIsBankDropdownOpen(false)
                                                                        }}
                                                                        className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between transition-colors ${
                                                                            isSelected
                                                                                ? 'bg-[#8a6d38]/30 text-[#e8c883] font-semibold'
                                                                                : 'text-[#f3ecd8] hover:bg-[#1a1b20]'
                                                                        }`}
                                                                    >
                                                                        <span>{item.name}</span>
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0d0d0f] border border-[#8a6d38]/30 text-[#00b2ff]">
                                                                            E-Wallet
                                                                        </span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Nomor Rekening / E-Wallet Input with Live Validation */}
                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    {isEwallet ? 'Nomor HP E-Wallet' : 'Nomor Rekening'} <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={isEwallet ? 'Contoh: 081234567890' : 'Contoh: 1234567890'}
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                    className={`w-full bg-[#0d0d0f] border rounded-md px-3.5 py-2 text-sm text-[#f3ecd8] font-mono outline-none transition-colors ${
                                        cleanAccountNumber.length > 0
                                            ? accountNumberValidation.isValid
                                                ? 'border-[#3fa46a] focus:border-[#3fa46a]'
                                                : 'border-red-500/80 focus:border-red-500'
                                            : 'border-[#8a6d38]/40 focus:border-[#c5a369]'
                                    }`}
                                />
                                {cleanAccountNumber.length > 0 ? (
                                    <div className="flex items-center gap-1 mt-1 text-[11px]">
                                        {accountNumberValidation.isValid ? (
                                            <>
                                                <CheckCircle2 size={12} className="text-[#3fa46a] shrink-0" strokeWidth={1.5} />
                                                <span className="text-[#3fa46a]">{accountNumberValidation.message}</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={12} className="text-red-400 shrink-0" strokeWidth={1.5} />
                                                <span className="text-red-400">{accountNumberValidation.message}</span>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-[#a89f8a] mt-1">
                                        {isEwallet
                                            ? 'Format: 08xx atau 62xx (10–14 digit)'
                                            : 'Format: 8–20 digit angka tanpa spasi'
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Nama Pemilik Rekening */}
                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    Nama Pemilik Rekening <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nama sesuai rekening"
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value)}
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2 text-sm text-[#f3ecd8] uppercase outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Estimasi & Tombol Lanjut */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-[#a89f8a]">Estimasi Uang Cair Bersih:</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-[#3fa46a] font-mono">
                                    {formatRupiah(netMoney)}
                                </span>
                                {adminFee > 0 ? (
                                    <span className="text-[11px] text-[#a89f8a]">
                                        (Dipotong fee admin {formatRupiah(adminFee)})
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-[#3fa46a] font-bold">
                                        (Member Bebas Fee)
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-md bg-[#3fa46a] hover:bg-[#358a59] text-white font-poppins font-semibold text-xs sm:text-sm tracking-wide transition-colors shadow-sm flex items-center gap-2"
                        >
                            <span>Lanjut ke Akun Penampung</span>
                            <ArrowRight size={15} />
                        </button>
                    </div>

                </form>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: INSTRUKSI AKUN PENAMPUNG & UPLOAD BUKTI                           */}
            {/* ========================================================================= */}
            {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                    
                    {/* Header Step 2: Timer & Back */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-3.5 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs font-inter text-[#a89f8a] hover:text-[#f3ecd8] flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft size={14} />
                            <span>Ubah Data Rekening</span>
                        </button>

                        <div className="flex items-center gap-2 text-xs font-inter text-[#a89f8a]">
                            <Clock size={14} className="text-[#c5a369]" />
                            <span>Sisa Waktu Kirim Koin:</span>
                            <span className="font-mono font-bold text-[#e8c883] text-sm">{formatTime(timeLeft)}</span>
                        </div>
                    </div>

                    {/* Box Akun Admin Penampung Chip */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-5 sm:p-6 text-center space-y-4 shadow-sm">
                        <span className="inline-block px-3 py-1 rounded bg-[#0d0d0f] text-[#c5a369] text-xs font-poppins font-bold border border-[#8a6d38]/50 uppercase tracking-wide">
                            Kirim Koin Sebanyak {totalB}B ke Akun Admin Ini:
                        </span>

                        <div className="bg-[#0d0d0f] border border-[#8a6d38]/30 rounded-lg p-4 max-w-sm mx-auto space-y-2">
                            <p className="text-xs text-[#a89f8a]">User ID Game Admin Penampung:</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-bold font-mono text-[#f3ecd8] tracking-wider">
                                    {adminTargetAccount.id}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(adminTargetAccount.id)
                                        setCopiedAdminId(true)
                                        setTimeout(() => setCopiedAdminId(false), 2000)
                                    }}
                                    className="p-1.5 rounded bg-[#17171a] border border-[#8a6d38]/50 hover:border-[#c5a369] text-[#c5a369] hover:text-[#e8c883] transition-colors text-xs flex items-center gap-1"
                                >
                                    {copiedAdminId ? <Check size={14} className="text-[#3fa46a]" /> : <Copy size={14} />}
                                    <span>{copiedAdminId ? 'Tersalin' : 'Salin ID'}</span>
                                </button>
                            </div>
                            <p className="text-xs text-[#e8c883] font-semibold">
                                Nickname: {adminTargetAccount.nickname}
                            </p>
                        </div>

                        <p className="text-xs text-[#a89f8a] max-w-md mx-auto">
                            Buka game Anda, kirim koin persis sebesar <strong className="text-[#f3ecd8]">{totalB}B</strong> ke ID di atas, lalu screenshot bukti transfer game Anda.
                        </p>
                    </div>

                    {/* Rincian Uang yang Diterima */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 space-y-3">
                        <h3 className="text-xs font-poppins font-bold text-[#f3ecd8] uppercase tracking-wide pb-2 border-b border-[#8a6d38]/20">
                            Rincian Pembayaran Uang Cair
                        </h3>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-[#a89f8a]">
                                <span>Nilai Koin ({totalB}B):</span>
                                <span className="font-mono text-[#f3ecd8]">{formatRupiah(grossMoney)}</span>
                            </div>

                            <div className="flex justify-between text-[#a89f8a]">
                                <span>Biaya Admin Fee:</span>
                                <span className={`font-mono ${adminFee === 0 ? 'text-[#3fa46a] font-bold' : 'text-[#f3ecd8]'}`}>
                                    {adminFee === 0 ? 'Rp 0 (Member Bebas Fee)' : `-${formatRupiah(adminFee)}`}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-[#8a6d38]/20 flex justify-between text-sm font-bold text-[#f3ecd8]">
                                <span>Total Uang Bersih Yang Anda Terima:</span>
                                <span className="text-[#3fa46a] font-mono text-base">{formatRupiah(netMoney)}</span>
                            </div>

                            <div className="flex justify-between text-[#a89f8a] pt-1">
                                <span>Rekening Tujuan:</span>
                                <span className="text-[#f3ecd8]">{selectedBank} — {accountNumber} ({accountName})</span>
                            </div>
                        </div>
                    </div>

                    {/* Upload Bukti Pengiriman Koin */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 space-y-3 text-center">
                        <h3 className="text-xs font-poppins font-bold text-[#f3ecd8] uppercase tracking-wide">
                            Upload Bukti Kirim Koin Dari Game
                        </h3>
                        <p className="text-xs text-[#a89f8a]">
                            Unggah screenshot riwayat pengiriman koin Anda ke akun admin
                        </p>

                        <div className="border-2 border-dashed border-[#8a6d38]/40 hover:border-[#c5a369] rounded-lg p-6 relative cursor-pointer bg-[#0d0d0f] transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />

                            {uploadingProof ? (
                                <p className="text-xs text-[#a89f8a]">Mengunggah gambar bukti...</p>
                            ) : proofImage ? (
                                <div className="space-y-2">
                                    <Image src={proofImage} alt="Bukti" width={240} height={160} className="max-h-40 w-auto mx-auto rounded border border-[#8a6d38]/40 object-contain" unoptimized />
                                    <p className="text-xs text-[#3fa46a] font-semibold">Bukti berhasil diunggah! Klik untuk mengganti.</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Upload size={24} className="mx-auto text-[#c5a369]" />
                                    <p className="text-xs font-medium text-[#f3ecd8]">Klik atau letakkan foto bukti kirim koin di sini</p>
                                    <p className="text-[10px] text-[#8a6d38]">Format JPG, PNG hingga 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tombol Kirim Permintaan Bongkar */}
                    <button
                        type="button"
                        disabled={submitting || uploadingProof || !proofImage}
                        onClick={handleFinalSubmit}
                        className="w-full py-2.5 rounded-md bg-[#3fa46a] hover:bg-[#358a59] disabled:opacity-50 text-white font-poppins font-semibold text-xs sm:text-sm tracking-wide transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <span>Memproses Permintaan...</span>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                <span>KIRIM PERMINTAAN BONGKAR</span>
                            </>
                        )}
                    </button>

                </div>
            )}

            {/* Modal Status Transaksi Real-time */}
            <TransactionStatusModal
                isOpen={showStatusModal}
                transactionId={createdTxId}
                onClose={() => setShowStatusModal(false)}
            />

        </div>
    )
}
