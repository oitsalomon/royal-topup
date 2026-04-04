'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Users } from 'lucide-react'
import Link from 'next/link'

// Audio dibuat satu kali di module level — tidak recreate setiap mount
// Ini mencegah browser membuat Audio object baru setiap komponen mount/unmount
let notifAudio: HTMLAudioElement | null = null
function getAudio() {
    if (typeof window === 'undefined') return null
    if (!notifAudio) {
        notifAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
        notifAudio.volume = 0.7
    }
    return notifAudio
}

export default function PendingNotifier() {
    const [pendingCount, setPendingCount] = useState(0)
    const [referralCount, setReferralCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [isReferralVisible, setIsReferralVisible] = useState(false)
    const prevPendingRef = useRef(0)
    const prevReferralRef = useRef(0)

    const checkPending = async () => {
        try {
            const res = await fetch('/api/internal/notifications')
            const data = await res.json()

            if (data.error) return

            const pCount = data.pending || 0
            const rCount = data.referral || 0
            const audio = getAudio()

            // Regular Transactions
            if (pCount > 0) {
                if (pCount > prevPendingRef.current && audio) {
                    audio.play().catch(() => {})
                }
                if (pCount !== prevPendingRef.current) setIsVisible(true)
                prevPendingRef.current = pCount
                setPendingCount(pCount)
            } else {
                prevPendingRef.current = 0
                setPendingCount(0)
                setIsVisible(false)
            }

            // Referral Transactions
            if (rCount > 0) {
                if (rCount > prevReferralRef.current && audio) {
                    audio.play().catch(() => {})
                }
                if (rCount !== prevReferralRef.current) setIsReferralVisible(true)
                prevReferralRef.current = rCount
                setReferralCount(rCount)
            } else {
                prevReferralRef.current = 0
                setReferralCount(0)
                setIsReferralVisible(false)
            }
        } catch (error) {
            console.error('Failed to check pending transactions:', error)
        }
    }

    useEffect(() => {
        checkPending()
        // Poll setiap 15s — cukup responsif tanpa membebani server
        const interval = setInterval(checkPending, 15000)
        return () => clearInterval(interval)
    }, [])

    // Auto-hide Timer
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => setIsVisible(false), 8000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, pendingCount])

    useEffect(() => {
        if (isReferralVisible) {
            const timer = setTimeout(() => setIsReferralVisible(false), 8000)
            return () => clearTimeout(timer)
        }
    }, [isReferralVisible, referralCount])

    if (!isVisible && !isReferralVisible) return null

    return (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 space-y-3">
            {/* Referral Notification */}
            {isReferralVisible && referralCount > 0 && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-1 rounded-2xl shadow-2xl shadow-violet-500/30 border border-white/10">
                    <div className="bg-[#0a0f1c] rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                                <Users className="animate-bounce" size={24} />
                            </div>
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0a0f1c]">
                                {referralCount}
                            </span>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">WD Referral!</h4>
                            <p className="text-xs text-gray-400">{referralCount} penarikan bonus menunggu.</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 border-l border-white/10 pl-4">
                            <Link
                                href="/admin/referral-withdrawals"
                                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                            >
                                Cek WD
                            </Link>
                            <button
                                onClick={() => setIsReferralVisible(false)}
                                className="text-gray-500 hover:text-white text-xs flex items-center justify-center"
                            >
                                <X size={14} className="mr-1" /> Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Notification */}
            {isVisible && pendingCount > 0 && (
                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-1 rounded-2xl shadow-2xl shadow-orange-500/30 border border-white/10">
                    <div className="bg-[#0a0f1c] rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                        {/* Removed animate-pulse from the accent bar — it was triggering repaints constantly */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                                <Bell className="animate-bounce" size={24} />
                            </div>
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0a0f1c]">
                                {pendingCount}
                            </span>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Pesanan Baru!</h4>
                            <p className="text-xs text-gray-400">{pendingCount} transaksi menunggu persetujuan.</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 border-l border-white/10 pl-4">
                            <Link
                                href="/admin/transactions"
                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                            >
                                Cek
                            </Link>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-gray-500 hover:text-white text-xs flex items-center justify-center"
                            >
                                <X size={14} className="mr-1" /> Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
