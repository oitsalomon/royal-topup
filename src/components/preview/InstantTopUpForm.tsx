'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthProvider'
import {
    Zap,
    Clock,
    ShieldCheck,
    Coins,
    Headphones,
    MessageCircle,
    Send,
    Instagram,
    Copy,
    Check,
    Download,
    X,
    Flame,
    QrCode,
    Info,
    CheckCircle2
} from 'lucide-react'
import dynamic from 'next/dynamic'

const TransactionStatusModal = dynamic(() => import('../TransactionStatusModal'), { ssr: false })

interface PaymentMethod {
    id: number
    name: string
    type: string
    account_number: string
    account_name: string
    image?: string | null
}

interface PackageItem {
    id: number
    name: string
    chip: number
    price: number
    originalPrice?: number
    image?: string
    discount?: string
    isPinned?: boolean
    qris_image?: string
}

interface InstantTopUpFormProps {
    gameCode: string
    gameName: string
    gameId: number
    initialPackages?: PackageItem[]
}

const DEFAULT_PACKAGES: PackageItem[] = [
    { id: 101, name: '150M', chip: 150, price: 10049, originalPrice: 10149, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 102, name: '200M', chip: 200, price: 13109, originalPrice: 13209, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 103, name: '300M', chip: 300, price: 19174, originalPrice: 19814, discount: '-3%', image: '/images/products/clover-chip.webp' },
    { id: 104, name: '400M', chip: 400, price: 26318, originalPrice: 26418, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 105, name: '500M', chip: 500, price: 32500, originalPrice: 33023, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 106, name: '600M', chip: 600, price: 39000, originalPrice: 39627, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 107, name: '700M', chip: 700, price: 45500, originalPrice: 46232, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 108, name: '800M', chip: 800, price: 52500, originalPrice: 52836, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 109, name: '900M', chip: 900, price: 58500, originalPrice: 59441, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 110, name: '1B', chip: 1000, price: 65010, originalPrice: 65148, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 111, name: '1.5B', chip: 1500, price: 97515, originalPrice: 97722, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 112, name: '2B', chip: 2000, price: 130020, originalPrice: 130295, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 113, name: '3B', chip: 3000, price: 195030, originalPrice: 195443, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 114, name: '4B', chip: 4000, price: 260040, originalPrice: 260590, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 115, name: '5B', chip: 5000, price: 325050, originalPrice: 325737, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 116, name: '10B', chip: 10000, price: 645010, originalPrice: 651474, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 117, name: '15B', chip: 15000, price: 967515, originalPrice: 977211, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 118, name: '20B', chip: 20000, price: 1280020, originalPrice: 1302948, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 119, name: '30B', chip: 30000, price: 1920030, originalPrice: 1923210, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 120, name: '40B', chip: 40000, price: 2560040, originalPrice: 2564280, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 121, name: '50B', chip: 50000, price: 3150050, originalPrice: 3205350, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 122, name: '75B', chip: 75000, price: 4725075, originalPrice: 4808025, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 123, name: '100B', chip: 100000, price: 6290100, originalPrice: 6303600, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 124, name: '150B', chip: 150000, price: 9420150, originalPrice: 9616050, discount: '-2%', image: '/images/products/clover-chip.webp' },
]

export default function InstantTopUpForm({ gameCode, gameName, gameId, initialPackages }: InstantTopUpFormProps) {
    const { user } = useAuth()

    // Form states
    const [userIdGame, setUserIdGame] = useState('')
    const [nickname, setNickname] = useState('')
    const [userWa, setUserWa] = useState('')
    const [senderName, setSenderName] = useState('')

    const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null)
    const [packagesList, setPackagesList] = useState<PackageItem[]>(initialPackages && initialPackages.length > 0 ? initialPackages : DEFAULT_PACKAGES)

    const [qrisMethod, setQrisMethod] = useState<PaymentMethod>({
        id: 1,
        name: 'QRIS Realtime',
        type: 'QRIS',
        account_number: 'QRIS-AUTO',
        account_name: 'ROYAL CLOVER TOPUP',
        image: '/images/payment/qris.jpg'
    })

    // QRIS modal states
    const [uniqueCode, setUniqueCode] = useState(0)
    const [showQrModal, setShowQrModal] = useState(false)
    const [timeLeft, setTimeLeft] = useState(300)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [copiedAmount, setCopiedAmount] = useState(false)

    // Status modal
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [activeTxId, setActiveTxId] = useState<number>(0)

    useEffect(() => {
        fetch('/api/packages')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const mapped = data.filter((p: any) => p.isActive !== false).map((p: any) => {
                        let disc = ''
                        if (p.originalPrice && p.originalPrice > p.price) {
                            const pct = Math.max(1, Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100))
                            disc = `-${pct}%`
                        }
                        return {
                            id: p.id,
                            name: p.name,
                            chip: p.chip,
                            price: p.price,
                            originalPrice: p.originalPrice,
                            image: p.image,
                            discount: disc,
                            isPinned: Boolean(p.isPinned),
                            qris_image: p.qris_image || ''
                        }
                    })
                    setPackagesList(mapped)
                }
            })
            .catch(() => {})

        fetch(`/api/payment-methods?gameCode=${gameCode || 'royal-dream'}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const qris = data.find((m: any) => m.type === 'QRIS') || data[0]
                    if (qris) setQrisMethod(qris)
                }
            })
            .catch(() => {})
    }, [gameCode])

    const finalAmountMoney = useMemo(() => {
        if (!selectedPackage) return 0
        return selectedPackage.price
    }, [selectedPackage])

    // Timer countdown
    useEffect(() => {
        if (!showQrModal) return
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [showQrModal])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const formatRupiah = (val: number) => {
        return 'Rp ' + Number(val).toLocaleString('id-ID')
    }

    // Direct QRIS modal trigger on click
    const handlePackageClick = (pkg: PackageItem) => {
        setSelectedPackage(pkg)

        if (!userIdGame.trim()) {
            const inputEl = document.getElementById('field-user-id')
            inputEl?.focus()
            return
        }

        setUniqueCode(Math.floor(Math.random() * 199) + 1)
        setTimeLeft(300)
        setShowQrModal(true)
    }

    const handleCopyAmount = () => {
        navigator.clipboard.writeText(finalAmountMoney.toString())
        setCopiedAmount(true)
        setTimeout(() => setCopiedAmount(false), 2000)
    }

    const handleConfirmPayment = async () => {
        if (!userIdGame.trim()) {
            alert('Silakan masukkan User ID Game Anda.')
            return
        }
        if (!user && !senderName.trim()) {
            alert('Mohon masukkan Nama Rekening Pengirim untuk pencocokan mutasi.')
            return
        }

        setIsSubmitting(true)
        try {
            const payload = {
                user_wa: userWa || '081200000000',
                user_id: user?.id || null,
                game_id: gameId,
                user_game_id: userIdGame.trim(),
                nickname: nickname.trim() || 'Pemain',
                package_id: selectedPackage?.id,
                amount_chip: (selectedPackage?.chip || 0) / 1000,
                amount_money: selectedPackage?.price || 0,
                payment_method_id: qrisMethod.id,
                sender_name: senderName.trim() || user?.username || null,
                type: 'TOPUP'
            }

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const txData = await res.json()
                setShowQrModal(false)
                setActiveTxId(txData.id)
                setShowStatusModal(true)
                localStorage.setItem('royal_topup_pending_tx', JSON.stringify({ id: txData.id, type: 'TOPUP' }))
            } else {
                alert('Gagal memproses pesanan. Silakan hubungi admin.')
            }
        } catch {
            alert('Terjadi kesalahan jaringan. Silakan coba kembali.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const hasCustomQris = Boolean(selectedPackage?.qris_image && selectedPackage.qris_image.trim() !== '')
    const activeQrisImage = (hasCustomQris && selectedPackage?.qris_image)
        ? selectedPackage.qris_image
        : (qrisMethod.image || '/images/payment/qris.jpg')

    return (
        <div className="w-full bg-[#0d0d0f] text-[#f3ecd8] font-inter antialiased">
            <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

                {/* ========================================================================= */}
                {/* 3. 3 BADGE KECIL HORIZONTAL (ICON + TEKS SINGKAT, BUKAN CARD)              */}
                {/* ========================================================================= */}
                <section className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-inter text-[#f3ecd8]">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Zap size={15} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                        <span>Proses Instan</span>
                    </div>
                    <span className="text-[#8a6d38] hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Clock size={15} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                        <span>Layanan 24 Jam</span>
                    </div>
                    <span className="text-[#8a6d38] hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <ShieldCheck size={15} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                        <span>Transaksi Aman</span>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 4. HEADLINE PENDEK (MAKS 8 KATA) + SUBHEADLINE 1 KALIMAT                   */}
                {/* ========================================================================= */}
                <section className="text-center space-y-2 max-w-xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-poppins font-semibold text-[#f3ecd8] leading-tight">
                        Top Up Chip Royal Dream Terpercaya
                    </h2>
                    <p className="text-xs sm:text-sm font-inter text-[#a89f8a] leading-relaxed">
                        Koin chip resmi diproses otomatis dalam hitungan detik langsung masuk ke akun game Anda.
                    </p>
                </section>

                {/* ========================================================================= */}
                {/* 5. PILL KONTAK ADMIN (WA/TELEGRAM) — BENTUK PILL ROUNDED                  */}
                {/* ========================================================================= */}
                <section className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#17171a] border border-[#8a6d38]/70 hover:border-[#c5a369] text-xs font-poppins font-semibold text-[#f3ecd8] transition-colors shadow-sm shrink-0"
                    >
                        <MessageCircle size={14} className="text-[#c5a369] shrink-0" />
                        <span>Admin WhatsApp</span>
                    </a>

                    <a
                        href="https://t.me/royalclover"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#17171a] border border-[#8a6d38]/70 hover:border-[#c5a369] text-xs font-poppins font-semibold text-[#f3ecd8] transition-colors shadow-sm shrink-0"
                    >
                        <Send size={14} className="text-[#c5a369] shrink-0" />
                        <span>Admin Telegram</span>
                    </a>

                    <Link
                        href={`/withdraw/${gameCode || 'royal-dream'}`}
                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#17171a] border border-[#8a6d38]/70 hover:border-[#e8c883] text-xs font-poppins font-semibold text-[#e8c883] transition-colors shadow-sm shrink-0"
                    >
                        <Flame size={14} className="text-[#e8c883] shrink-0" />
                        <span>Bongkaran Auto</span>
                    </Link>
                </section>

                {/* ========================================================================= */}
                {/* 6. FORM INPUT DATA AKUN DALAM SATU CARD GELAP                             */}
                {/* ========================================================================= */}
                <section className="max-w-xl mx-auto w-full">
                    <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-4 sm:p-5 shadow-sm space-y-3.5">
                        <div className="text-center pb-2 border-b border-[#8a6d38]/20">
                            <h3 className="text-sm font-poppins font-semibold text-[#f3ecd8]">
                                Masukkan Data Akun
                            </h3>
                            <p className="text-[11px] font-inter text-[#a89f8a] mt-0.5">
                                Pastikan User ID dan Nickname sudah sesuai dengan profil di game
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                    User ID Game <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="field-user-id"
                                    type="text"
                                    required
                                    placeholder="Contoh: 24761608"
                                    value={userIdGame}
                                    onChange={e => setUserIdGame(e.target.value)}
                                    className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3 py-2 text-base sm:text-sm font-inter text-[#f3ecd8] font-mono outline-none transition-colors placeholder-[#7a766c]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                        Nickname Akun
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: SultanRD"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3 py-2 text-base sm:text-sm font-inter text-[#f3ecd8] outline-none transition-colors placeholder-[#7a766c]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                                        Nomor WhatsApp <span className="text-[#7a766c] text-[10px]">(Opsional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="08xxxxxxxxxx"
                                        value={userWa}
                                        onChange={e => setUserWa(e.target.value)}
                                        className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3 py-2 text-base sm:text-sm font-inter text-[#f3ecd8] font-mono outline-none transition-colors placeholder-[#7a766c]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 7. GRID NOMINAL CHIP (KARTU GRADIENT EMAS & HIERARKI VISUAL TIER)        */}
                {/* ========================================================================= */}
                <section className="space-y-3 pt-2">
                    <div className="text-center space-y-1">
                        <h3 className="text-base sm:text-lg font-poppins font-bold text-[#f3ecd8]">
                            Pilih Nominal Chip
                        </h3>
                        <p className="text-xs font-inter text-[#a89f8a]">
                            Klik kartu untuk langsung membuka pembayaran QRIS
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                        {packagesList.map((pkg, index) => {
                            const isSelected = selectedPackage?.id === pkg.id
                            
                            // Visual hierarchy / tier treatment:
                            // Higher tier (>= 3000M / 3B): Brighter border + subtle gold glow
                            // Medium tier (500M - 2B): Medium gold border
                            // Lower tier (< 500M): Subtle gold border
                            const isHighTier = pkg.chip >= 3000
                            const isMidTier = pkg.chip >= 500 && pkg.chip < 3000

                            let cardClasses = 'bg-[#17171a] border border-[#8a6d38]/30 hover:border-[#c5a369]/60'
                            if (isHighTier) {
                                cardClasses = 'bg-gradient-to-b from-[#1b1a16] to-[#141417] border-2 border-[#c5a369] shadow-[0_0_14px_rgba(197,163,105,0.14)]'
                            } else if (isMidTier) {
                                cardClasses = 'bg-[#17171a] border border-[#c5a369]/40 hover:border-[#c5a369]'
                            }

                            if (isSelected) {
                                cardClasses += ' ring-2 ring-[#e8c883] !border-[#f3ecd8] scale-[1.02] bg-[#1e1e24] shadow-lg'
                            }

                            const imageSrc = pkg.image || '/images/products/clover-chip.webp'

                            return (
                                <button
                                    key={pkg.id}
                                    type="button"
                                    onClick={() => handlePackageClick(pkg)}
                                    className={`group relative text-left rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-200 active:scale-[0.98] ${cardClasses}`}
                                >
                                    {/* Full-width Product Photo (Edge-to-Edge) */}
                                    <div className="relative w-full aspect-square bg-[#070709] overflow-hidden">
                                        <Image
                                            src={imageSrc}
                                            alt={pkg.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                            priority={index === 0}
                                        />

                                        {/* Pinned Recommendation Banner */}
                                        {pkg.isPinned && (
                                            <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-[#f5b301] to-[#e8c883] text-[#0d0d0f] text-[9px] font-poppins font-black py-0.5 text-center shadow-md z-20 tracking-wider">
                                                ★ REKOMENDASI
                                            </div>
                                        )}

                                        {/* Discount Badge */}
                                        {pkg.discount && (
                                            <span className={`absolute ${pkg.isPinned ? 'top-5' : 'top-2'} right-2 bg-[#c5a369] text-[#0d0d0f] text-[10px] font-poppins font-black px-1.5 py-0.5 rounded-[4px] shadow-md z-10 tracking-tight`}>
                                                {pkg.discount}
                                            </span>
                                        )}

                                        {/* High Tier Sultan Badge */}
                                        {!pkg.isPinned && isHighTier && (
                                            <span className="absolute top-2 left-2 bg-[#17171a]/90 backdrop-blur-xs border border-[#c5a369]/60 text-[#e8c883] text-[9px] font-poppins font-bold px-1.5 py-0.5 rounded shadow z-10 tracking-wide">
                                                SULTAN
                                            </span>
                                        )}
                                    </div>

                                    {/* Bottom Details Section */}
                                    <div className="w-full p-2 sm:p-3 flex flex-col justify-between flex-1 bg-[#17171a] border-t border-[#8a6d38]/20">
                                        <div className="mb-1.5">
                                            <p className="text-sm sm:text-base font-poppins font-extrabold text-[#f3ecd8] tracking-tight leading-tight group-hover:text-[#e8c883] transition-colors truncate">
                                                {pkg.name}
                                            </p>
                                            <p className="text-[10px] font-inter font-medium text-[#a89f8a] leading-none mt-0.5">
                                                Chip Royal
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-[#8a6d38]/15 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-1 mt-auto">
                                            <p className="text-xs sm:text-sm font-poppins font-bold text-[#e8c883] font-mono leading-tight whitespace-nowrap">
                                                {formatRupiah(pkg.price)}
                                            </p>
                                            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                                <p className="text-[10px] font-inter line-through text-[#8a6d38] font-mono leading-none whitespace-nowrap">
                                                    {formatRupiah(pkg.originalPrice)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 8. SECTION FITUR / KENAPA PILIH KAMI (4 KOLOM, IKON OUTLINE TIPIS)        */}
                {/* ========================================================================= */}
                <section className="pt-4 border-t border-[#8a6d38]/20 space-y-4">
                    <h3 className="text-center text-sm sm:text-base font-poppins font-semibold text-[#f3ecd8]">
                        Kenapa Memilih Royal Clover
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
                        <div className="space-y-1.5 flex flex-col items-center sm:items-start">
                            <Zap size={22} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                            <h4 className="text-xs font-poppins font-semibold text-[#f3ecd8]">
                                Proses Otomatis
                            </h4>
                            <p className="text-[11px] font-inter text-[#a89f8a] leading-relaxed">
                                Chip terkirim 1-5 detik setelah transfer terverifikasi oleh sistem.
                            </p>
                        </div>

                        <div className="space-y-1.5 flex flex-col items-center sm:items-start">
                            <ShieldCheck size={22} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                            <h4 className="text-xs font-poppins font-semibold text-[#f3ecd8]">
                                100% Legal & Aman
                            </h4>
                            <p className="text-[11px] font-inter text-[#a89f8a] leading-relaxed">
                                Sumber chip resmi distributor tangan pertama tanpa risiko sanksi.
                            </p>
                        </div>

                        <div className="space-y-1.5 flex flex-col items-center sm:items-start">
                            <Coins size={22} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                            <h4 className="text-xs font-poppins font-semibold text-[#f3ecd8]">
                                Harga Terbaik
                            </h4>
                            <p className="text-[11px] font-inter text-[#a89f8a] leading-relaxed">
                                Tarif grosir distributor langsung paling stabil dan bersaing.
                            </p>
                        </div>

                        <div className="space-y-1.5 flex flex-col items-center sm:items-start">
                            <Headphones size={22} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                            <h4 className="text-xs font-poppins font-semibold text-[#f3ecd8]">
                                Bantuan 24 Jam
                            </h4>
                            <p className="text-[11px] font-inter text-[#a89f8a] leading-relaxed">
                                Customer service WhatsApp dan Telegram siaga memandu kendala Anda.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 9. FOOTER MINIMAL (SOCIAL BULAT OUTLINE, LINK LEGAL, COPYRIGHT KECIL)      */}
                {/* ========================================================================= */}
                <footer className="pt-6 pb-12 border-t border-[#8a6d38]/20 text-center space-y-4">
                    {/* Social Icon Bulat Outline */}
                    <div className="flex items-center justify-center gap-3">
                        <a
                            href="https://wa.me/6281234567890"
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-full border border-[#8a6d38]/70 hover:border-[#c5a369] flex items-center justify-center text-[#c5a369] hover:text-[#e8c883] transition-colors shrink-0"
                            aria-label="WhatsApp"
                        >
                            <MessageCircle size={15} strokeWidth={1.5} className="shrink-0" />
                        </a>

                        <a
                            href="https://t.me/royalclover"
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-full border border-[#8a6d38]/70 hover:border-[#c5a369] flex items-center justify-center text-[#c5a369] hover:text-[#e8c883] transition-colors shrink-0"
                            aria-label="Telegram"
                        >
                            <Send size={15} strokeWidth={1.5} className="shrink-0" />
                        </a>

                        <a
                            href="https://instagram.com/royalclover"
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-full border border-[#8a6d38]/70 hover:border-[#c5a369] flex items-center justify-center text-[#c5a369] hover:text-[#e8c883] transition-colors shrink-0"
                            aria-label="Instagram"
                        >
                            <Instagram size={15} strokeWidth={1.5} className="shrink-0" />
                        </a>
                    </div>

                    {/* Link Legal (No arrows) */}
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-inter text-[#a89f8a]">
                        <Link href="/terms" className="hover:text-[#f3ecd8] transition-colors">
                            Syarat & Ketentuan
                        </Link>
                        <span>•</span>
                        <Link href="/privacy" className="hover:text-[#f3ecd8] transition-colors">
                            Kebijakan Privasi
                        </Link>
                        <span>•</span>
                        <Link href="/check-transaction" className="hover:text-[#f3ecd8] transition-colors">
                            Cek Transaksi
                        </Link>
                    </div>

                    {/* Copyright Kecil */}
                    <p className="text-[11px] font-inter text-[#7a766c]">
                        © 2026 Royal Clover. Hak Cipta Dilindungi.
                    </p>
                </footer>

            </main>

            {/* ========================================================================= */}
            {/* POP-UP MODAL QRIS INSTAN (SOLID PALETTE & 6-10PX BORDER RADIUS)          */}
            {/* ========================================================================= */}
            {showQrModal && selectedPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-[#17171a] border border-[#8a6d38]/60 w-full max-w-sm rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Header Modal */}
                        <div className="p-3.5 sm:p-4 border-b border-[#8a6d38]/30 flex items-center justify-between bg-[#0d0d0f]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-md overflow-hidden bg-[#17171a] border border-[#8a6d38]/40 flex-shrink-0 flex items-center justify-center p-0.5">
                                    <Image
                                        src={selectedPackage.image || '/images/products/clover-chip.webp'}
                                        alt={selectedPackage.name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-poppins font-bold text-[#f3ecd8]">
                                        Pembayaran QRIS
                                    </h3>
                                    <p className="text-[11px] font-inter text-[#a89f8a] mt-0.5">
                                        Paket: <span className="text-[#e8c883] font-semibold">{selectedPackage.name}</span> | ID: {userIdGame} {nickname ? `(${nickname})` : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="p-1 rounded-md text-[#a89f8a] hover:text-[#f3ecd8] hover:bg-[#17171a] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-3.5 sm:p-4 space-y-3">
                            
                            {/* Timer */}
                            <div className="flex items-center justify-between p-2 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/30 text-xs font-inter">
                                <span className="text-[#a89f8a] flex items-center gap-1.5 text-[11px]">
                                    <Clock size={13} className="text-[#c5a369]" />
                                    <span>Batas Waktu Bayar:</span>
                                </span>
                                <span className="font-mono font-bold text-[#e8c883]">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Status QRIS: Statis Khusus atau Global */}
                            {hasCustomQris ? (
                                <div className="flex items-center gap-2 p-2.5 rounded-md bg-emerald-950/40 border border-emerald-500/40 text-xs font-inter text-emerald-300">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <div>
                                        <span className="font-bold text-emerald-300">QRIS Statis Khusus (Nominal Pas)</span>
                                        <p className="text-[10px] text-emerald-400/80">Nominal <strong>{formatRupiah(finalAmountMoney)}</strong> sudah otomatis terisi saat di-scan.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-[#0d0d0f] border border-[#8a6d38]/30 text-xs font-inter text-[#f3ecd8]">
                                    <Info size={14} className="text-[#c5a369] shrink-0" />
                                    <div>
                                        <span className="font-semibold text-[#e8c883]">QRIS Toko Resmi</span>
                                        <p className="text-[10px] text-[#a89f8a]">Transfer pas sesuai nominal <strong className="text-[#f3ecd8]">{formatRupiah(finalAmountMoney)}</strong> di m-banking Anda.</p>
                                    </div>
                                </div>
                            )}

                            {/* Gambar QRIS */}
                            <div className="bg-[#0d0d0f] border border-[#8a6d38]/30 p-3 rounded-lg flex flex-col items-center text-center">
                                <div className="bg-white p-2 rounded-md shadow-sm max-w-[200px] w-full mb-2 border border-[#8a6d38]/40 aspect-square flex items-center justify-center">
                                    <Image
                                        src={activeQrisImage}
                                        alt={`QRIS ${selectedPackage.name}`}
                                        width={184}
                                        height={184}
                                        className="w-full h-auto object-contain"
                                        unoptimized
                                    />
                                </div>

                                <a
                                    href={activeQrisImage}
                                    download={`QRIS_${selectedPackage.name}.jpg`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#17171a] hover:bg-[#202024] text-[#f3ecd8] text-xs font-poppins font-medium border border-[#8a6d38]/50 transition-colors mb-1"
                                >
                                    <Download size={13} />
                                    <span>Simpan Gambar QR</span>
                                </a>

                                <p className="text-[10px] font-inter text-[#a89f8a]">
                                    Scan via BCA, Mandiri, BRI, BNI, Dana, GoPay, OVO, ShopeePay
                                </p>
                            </div>

                            {/* Jumlah Transfer Tepat */}
                            <div className="p-3 rounded-lg bg-[#0d0d0f] border border-[#8a6d38]/30 text-center space-y-1">
                                <p className="text-[11px] font-inter text-[#a89f8a]">
                                    {hasCustomQris ? 'Nominal Pembayaran Terkunci:' : 'Jumlah Transfer (Harus Pas):'}
                                </p>
                                <div
                                    onClick={handleCopyAmount}
                                    className="inline-flex items-center gap-2 cursor-pointer bg-[#17171a] hover:bg-[#202024] px-3 py-1.5 rounded-md transition-colors border border-[#8a6d38]/50"
                                >
                                    <span className="text-base sm:text-lg font-poppins font-bold font-mono text-[#e8c883]">
                                        {formatRupiah(finalAmountMoney)}
                                    </span>
                                    {copiedAmount ? (
                                        <Check size={14} className="text-[#3fa46a]" />
                                    ) : (
                                        <Copy size={14} className="text-[#c5a369]" />
                                    )}
                                </div>
                                <p className="text-[10px] font-inter text-[#c5a369]">
                                    {hasCustomQris
                                        ? `*QRIS ini sudah terkunci nominal pas Rp ${finalAmountMoney.toLocaleString('id-ID')}. Cukup scan & bayar langsung tanpa ketik nominal!`
                                        : `*Transfer pas sesuai nominal di atas (Rp ${finalAmountMoney.toLocaleString('id-ID')}) agar sistem otomatis memverifikasi pesanan.`
                                    }
                                </p>
                            </div>

                            {/* Nama Rekening Pengirim untuk Non-Member */}
                            {!user && (
                                <div className="space-y-1 p-3 rounded-lg bg-[#0d0d0f] border border-[#8a6d38]/30 text-left">
                                    <label className="block text-xs font-inter font-medium text-[#f3ecd8]">
                                        Nama Rekening Pengirim <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nama sesuai rekening / e-wallet Anda"
                                        value={senderName}
                                        onChange={e => setSenderName(e.target.value)}
                                        className="w-full bg-[#17171a] border border-[#8a6d38]/40 rounded-md px-3 py-1.5 text-base sm:text-xs text-[#f3ecd8] uppercase outline-none focus:border-[#c5a369]"
                                    />
                                    <p className="text-[10px] font-inter text-[#7a766c]">
                                        Dibutuhkan untuk pencocokan mutasi bank otomatis.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Action (Tombol Konfirmasi Solid & Tombol Batal Solid) */}
                        <div className="p-3 border-t border-[#8a6d38]/30 bg-[#0d0d0f] flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleConfirmPayment}
                                className="w-full py-2.5 rounded-md bg-[#3fa46a] hover:bg-[#358a59] disabled:opacity-50 text-white font-poppins font-semibold text-xs sm:text-sm transition-colors text-center shadow-sm"
                            >
                                {isSubmitting ? 'Memproses...' : 'Saya Sudah Transfer'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowQrModal(false)}
                                className="w-full py-2 rounded-md bg-[#3a3a3f] hover:bg-[#48484e] text-[#f3ecd8] font-poppins font-semibold text-xs transition-colors text-center"
                            >
                                Batal
                            </button>

                            <p className="text-center text-[10px] font-inter text-[#7a766c]">
                                Ada kendala? <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="text-[#a89f8a] underline hover:text-[#f3ecd8]">Hubungi Admin CS</a>
                            </p>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal Status Transaksi */}
            <TransactionStatusModal
                isOpen={showStatusModal}
                transactionId={activeTxId}
                onClose={() => setShowStatusModal(false)}
            />

        </div>
    )
}
