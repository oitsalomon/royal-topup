'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'

export default function PendingNotifier() {
    const [pendingCount, setPendingCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const checkPending = async () => {
        try {
            // Fetch only necessary metadata to save bandwidth
            const res = await fetch('/api/transactions?status=PENDING&limit=1')
            const data = await res.json()

            if (data?.pagination?.total > 0) {
                setPendingCount(data.pagination.total)
                setIsVisible(true)

                // Play Sound
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.log('Audio play failed (autoplay policy)', e))
                }
            } else {
                setIsVisible(false) // Hide if no pending
            }
        } catch (error) {
            console.error('Failed to check pending transactions:', error)
        }
    }

    useEffect(() => {
        // Init Audio
        audioRef.current = new Audio('/sounds/notification.mp3') // We need to ensure this file exists or use a CDN
        // Alternatively use a base64 short beep for simplicity if file not present, 
        // but for now let's assume we might need to add a file or use a public URL.
        // Let's use a public notification sound URL for reliability without adding assets.
        audioRef.current.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

        // Check immediately
        checkPending()

        // Check every 30 seconds
        const interval = setInterval(checkPending, 30000)

        return () => clearInterval(interval)
    }, [])

    if (!isVisible || pendingCount === 0) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-1 rounded-2xl shadow-2xl shadow-orange-500/30 border border-white/10">
                <div className="bg-[#0a0f1c] rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                    {/* Glow Effect */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 animate-pulse" />

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
                            Cek Sekarang
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
        </div>
    )
}
