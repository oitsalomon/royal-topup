'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Coins, RefreshCcw, ArrowLeft, Trophy, CreditCard, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'

export default function LoyaltyPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [points, setPoints] = useState(0)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        if (user?.id) fetchPoints()
    }, [user])

    const fetchPoints = async () => {
        try {
            const res = await fetch(`/api/members/me?id=${user?.id}`)
            if (res.ok) {
                const data = await res.json()
                setPoints(data.user.loyalty_points || 0)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getCurrentPeriod = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const isFirstHalf = now.getDate() <= 15
        return `${year}-${month}-${isFirstHalf ? 'H1' : 'H2'}`
    }

    const handleRedeem = async (itemKey: string, cost: number, itemType: string) => {
        if (points < cost) {
            alert('Poin tidak cukup!')
            return
        }

        if (!confirm('Tukar poin dengan reward ini?')) return

        setProcessing(itemKey)
        try {
            // Determine period for Tickets
            let period = undefined
            if (itemType === 'TICKET') {
                period = getCurrentPeriod()
            }

            const res = await fetch('/api/loyalty/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': String(user?.id)
                },
                body: JSON.stringify({ rewardKey: itemKey, period })
            })

            const data = await res.json()
            if (res.ok) {
                alert('Berhasil menukarkan poin!')
                fetchPoints() // Refresh points
            } else {
                alert(data.error || 'Gagal menukarkan poin')
            }
        } catch (error) {
            alert('Terjadi kesalahan')
        } finally {
            setProcessing(null)
        }
    }

    if (loading) return <div className="min-h-screen bg-[#050912] pt-24 text-white text-center">Loading...</div>

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#050912]">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Loyalty Center</h1>
                        <p className="text-gray-400 text-sm">Tukar poin loyalitasmu dengan hadiah eksklusif</p>
                    </div>
                </div>

                {/* Points Card */}
                <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-emerald-900 to-black border border-emerald-500/30">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                                <Coins className="text-emerald-400 w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-1">Loyalty Points</p>
                                <h2 className="text-4xl font-black text-white tracking-tight">{points.toLocaleString()} <span className="text-lg text-gray-500 font-medium">LP</span></h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reward Sections */}

                {/* 1. Lottery Tickets */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Ticket className="text-amber-400" /> Tiket Undian (Grand Prize 100M)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1 Ticket */}
                        <RewardCard
                            title="1 Tiket Undian"
                            cost={5}
                            icon={<Ticket className="text-amber-400" />}
                            desc="1x Kesempatan Menang"
                            onRedeem={() => handleRedeem('TICKET_1', 5, 'TICKET')}
                            processing={processing === 'TICKET_1'}
                            canAfford={points >= 5}
                        />
                        {/* 6 Tickets */}
                        <RewardCard
                            title="6 Tiket Undian"
                            cost={25}
                            icon={<div className="flex"><Ticket className="text-amber-400 -mr-2" /><Ticket className="text-amber-400" /></div>}
                            desc="Lebih hemat 5 poin!"
                            onRedeem={() => handleRedeem('TICKET_6', 25, 'TICKET')}
                            processing={processing === 'TICKET_6'}
                            canAfford={points >= 25}
                            badge="HEMAT"
                        />
                        {/* 15 Tickets */}
                        <RewardCard
                            title="15 Tiket Undian"
                            cost={50}
                            icon={<div className="flex"><Ticket className="text-amber-400 -mr-2" /><Ticket className="text-amber-400 -mr-2" /><Ticket className="text-amber-400" /></div>}
                            desc="Paket Sultan (Hemat 25 poin)"
                            onRedeem={() => handleRedeem('TICKET_15', 50, 'TICKET')}
                            processing={processing === 'TICKET_15'}
                            canAfford={points >= 50}
                            badge="BEST VALUE"
                        />
                    </div>
                </div>

                {/* 2. Admin Vouchers */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-blue-400" /> Voucher Admin WD
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RewardCard
                            title="Voucher Potong Admin"
                            cost={40}
                            icon={<CreditCard className="text-blue-400" />}
                            desc="Gratis Biaya Admin WD 1x"
                            onRedeem={() => handleRedeem('VOUCHER_WD_1', 40, 'VOUCHER')}
                            processing={processing === 'VOUCHER_WD_1'}
                            canAfford={points >= 40}
                        />
                        <RewardCard
                            title="Paket Voucher (3x)"
                            cost={110}
                            icon={<div className="relative"><CreditCard className="text-blue-400" /><span className="absolute -top-1 -right-1 bg-blue-500 text-[8px] px-1 rounded text-white">x3</span></div>}
                            desc="Hemat 10 Poin. Untuk 3x WD."
                            onRedeem={() => handleRedeem('VOUCHER_WD_3', 110, 'VOUCHER')}
                            processing={processing === 'VOUCHER_WD_3'}
                            canAfford={points >= 110}
                        />
                    </div>
                </div>

                {/* 3. Banners */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ImageIcon className="text-purple-400" /> Banner Profil Eksklusif
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <RewardCard
                            title="Silver Banner"
                            cost={30}
                            icon={<div className="w-8 h-8 rounded bg-gray-400" />}
                            desc="Tampilan Silver Mewah"
                            onRedeem={() => handleRedeem('BANNER_SILVER', 30, 'BANNER')}
                            processing={processing === 'BANNER_SILVER'}
                            canAfford={points >= 30}
                        />
                        <RewardCard
                            title="Gold Banner"
                            cost={80}
                            icon={<div className="w-8 h-8 rounded bg-yellow-500" />}
                            desc="Tampilan Gold Sultan"
                            onRedeem={() => handleRedeem('BANNER_GOLD', 80, 'BANNER')}
                            processing={processing === 'BANNER_GOLD'}
                            canAfford={points >= 80}
                        />
                        <RewardCard
                            title="Diamond Banner"
                            cost={150}
                            icon={<div className="w-8 h-8 rounded bg-cyan-400 shadow-[0_0_10px_cyan]" />}
                            desc="Status Tertinggi"
                            onRedeem={() => handleRedeem('BANNER_DIAMOND', 150, 'BANNER')}
                            processing={processing === 'BANNER_DIAMOND'}
                            canAfford={points >= 150}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}

function RewardCard({ title, cost, icon, desc, onRedeem, processing, canAfford, badge }: any) {
    return (
        <div className="relative p-5 rounded-2xl bg-[#161b22] border border-white/5 hover:border-emerald-500/30 transition-all group">
            {badge && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl shadow-lg">
                    {badge}
                </div>
            )}
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-emerald-400 font-black text-xl">{cost}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Points</p>
                </div>
            </div>
            <h4 className="text-white font-bold mb-1">{title}</h4>
            <p className="text-xs text-gray-400 mb-4">{desc}</p>

            <button
                onClick={onRedeem}
                disabled={processing || !canAfford}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${canAfford
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {processing ? <RefreshCcw className="animate-spin" size={14} /> : 'Tukar'}
            </button>
        </div>
    )
}
