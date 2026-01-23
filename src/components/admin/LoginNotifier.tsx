'use client'

import { useState, useEffect, useRef } from 'react'
import { User, X, Clock } from 'lucide-react'
import Link from 'next/link'

interface ActivityLog {
    id: number
    user: { username: string }
    createdAt: string
}

export default function LoginNotifier() {
    const [latestLog, setLatestLog] = useState<ActivityLog | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const lastSeenIdRef = useRef<number>(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const checkLogins = async () => {
        try {
            // Fetch latest member login
            const res = await fetch('/api/internal/activity-logs?action=LOGIN&role=MEMBER&limit=1')
            const result = await res.json()

            if (result.data && result.data.length > 0) {
                const log = result.data[0]

                // Initialize lastSeenId on first run without notifying
                if (lastSeenIdRef.current === 0) {
                    lastSeenIdRef.current = log.id
                    return
                }

                // If new log found
                if (log.id > lastSeenIdRef.current) {
                    setLatestLog(log)
                    setIsVisible(true)
                    lastSeenIdRef.current = log.id

                    // Play Notification Sound (Subtle)
                    if (audioRef.current) {
                        audioRef.current.play().catch(e => console.log('Audio play failed', e))
                    }

                    // Auto-hide after 8 seconds
                    setTimeout(() => {
                        setIsVisible(false)
                    }, 8000)
                }
            }
        } catch (error) {
            console.error('Failed to check login logs:', error)
        }
    }

    useEffect(() => {
        // Init Audio - Louder "Positive Interface Beep" to ensure audibility
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3')

        // Initial check to set baseline
        checkLogins()

        // Poll every 15 seconds
        const interval = setInterval(checkLogins, 15000)

        return () => clearInterval(interval)
    }, [])

    if (!isVisible || !latestLog) return null

    return (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5 fade-in duration-500">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-1 rounded-2xl shadow-2xl shadow-cyan-500/30 border border-white/10 w-80">
                <div className="bg-[#0a0f1c] rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                    {/* Glow Effect */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 animate-pulse" />

                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <User size={20} />
                        </div>
                    </div>

                    <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">Member Login</h4>
                        <p className="text-xs text-cyan-200 mt-1 font-bold">{latestLog.user.username}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                            <Clock size={10} /> Baru saja
                        </p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-500 hover:text-white p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
