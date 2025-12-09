'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, User, ChevronDown, Phone, Send, MessageCircle, Download } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const pathname = usePathname()
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        // Fetch config once on mount
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error("Failed to load config", err))
    }, [])

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Close menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    if (pathname.startsWith('/admin')) return null

    return (
        <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-black/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:to-white transition-all">
                            AQUA STORE
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="text-sm font-medium text-white/80 hover:text-cyan-400 transition-colors relative group">
                                Home
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
                            </Link>
                            <Link href="/check-transaction" className="text-sm font-medium text-white/80 hover:text-cyan-400 transition-colors relative group">
                                Cek Transaksi
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
                            </Link>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Download App Dropdown */}
                        <div className="relative group">
                            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2">
                                Download App
                                <ChevronDown size={16} />
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                <a href={config?.download_app?.royal_dream || '#'} target="_blank" className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    Royal Dream
                                </a>
                                <a href={config?.download_app?.domino_rp || '#'} target="_blank" className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    Domino RP
                                </a>
                                <a href={config?.download_app?.neo || '#'} target="_blank" className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    Neo
                                </a>
                            </div>
                        </div>

                        {/* Hubungi CS Dropdown */}
                        <div className="relative group">
                            <button className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium transition-all flex items-center gap-2">
                                Hubungi CS
                                <ChevronDown size={16} />
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                <a href={`https://wa.me/${config?.contacts?.whatsapp?.number || ''}`} target="_blank" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    <Phone size={16} className="text-green-500" /> WhatsApp
                                </a>
                                <a href={`https://t.me/${config?.contacts?.telegram?.username || ''}`} target="_blank" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    <Send size={16} className="text-blue-500" /> Telegram
                                </a>
                                <a href={config?.contacts?.live_chat?.url || '#'} target="_blank" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    <MessageCircle size={16} className="text-yellow-500" /> Live Chat
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {isMobileMenuOpen ? <div className="p-1"><span className="text-xl font-bold">✕</span></div> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-[#0a0f1c] border-b border-white/10 shadow-2xl animate-in slide-in-from-top-4 z-40">
                    <div className="p-4 space-y-4">
                        <Link href="/" className="block px-4 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">
                            Home
                        </Link>
                        <Link href="/check-transaction" className="block px-4 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">
                            Cek Transaksi
                        </Link>

                        {/* Mobile Download App */}
                        <div className="space-y-2">
                            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Download Aplikasi</p>
                            <a href={config?.download_app?.royal_dream || '#'} target="_blank" className="block px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 text-pink-400 font-medium hover:bg-pink-500/20 transition-colors">
                                Royal Dream
                            </a>
                            <a href={config?.download_app?.domino_rp || '#'} target="_blank" className="block px-4 py-3 rounded-xl bg-white/5 text-gray-300 font-medium hover:bg-white/10 transition-colors">
                                Domino RP
                            </a>
                            <a href={config?.download_app?.neo || '#'} target="_blank" className="block px-4 py-3 rounded-xl bg-white/5 text-gray-300 font-medium hover:bg-white/10 transition-colors">
                                Neo
                            </a>
                        </div>

                        {/* Mobile Contact CS */}
                        <div className="space-y-2 pb-4">
                            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hubungi CS</p>
                            <div className="grid grid-cols-3 gap-2 px-4">
                                <a href={`https://wa.me/${config?.contacts?.whatsapp?.number || ''}`} target="_blank" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors">
                                    <Phone size={20} />
                                    <span className="text-xs">WA</span>
                                </a>
                                <a href={`https://t.me/${config?.contacts?.telegram?.username || ''}`} target="_blank" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors">
                                    <Send size={20} />
                                    <span className="text-xs">TG</span>
                                </a>
                                <a href={config?.contacts?.live_chat?.url || '#'} target="_blank" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                                    <MessageCircle size={20} />
                                    <span className="text-xs">Chat</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
