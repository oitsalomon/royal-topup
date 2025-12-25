'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Phone, Send, Headset } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function FloatingCS() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error(err))
    }, [])

    // Hide on Admin Routes
    if (pathname?.startsWith('/admin')) return null
    if (!config) return null

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
            {/* Options Menu */}
            {isOpen && (
                <div className="bg-[#0a0f1c]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 space-y-3 min-w-[200px] animate-in slide-in-from-bottom-5 fade-in duration-300 mb-2 origin-bottom-right">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-1">
                        Hubungi Kami
                    </div>

                    <a
                        href={`https://wa.me/${(config?.contacts?.whatsapp?.number || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Phone size={16} fill="currentColor" />
                        </div>
                        <span className="font-bold text-sm">WhatsApp</span>
                    </a>

                    <a
                        href={`https://t.me/${(config?.contacts?.telegram?.username || '').replace('https://t.me/', '').replace('@', '')}`}
                        target="_blank"
                        className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Send size={16} fill="currentColor" />
                        </div>
                        <span className="font-bold text-sm">Telegram</span>
                    </a>

                    <a
                        href={config?.contacts?.live_chat?.url || '#'}
                        target="_blank"
                        className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Headset size={16} />
                        </div>
                        <span className="font-bold text-sm">Live Chat</span>
                    </a>
                </div>
            )}

            {/* Float Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg shadow-cyan-500/20 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${isOpen
                    ? 'bg-red-500 rotate-90 text-white'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/40'
                    }`}
            >
                {isOpen ? (
                    <X size={28} />
                ) : (
                    <MessageCircle size={28} className="animate-pulse" />
                )}
            </button>
        </div>
    )
}
