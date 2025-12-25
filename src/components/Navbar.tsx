'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, User, ChevronDown, Phone, Send, MessageCircle, Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const pathname = usePathname()
    const [config, setConfig] = useState<any>(null)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        // Fetch config once on mount
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error("Failed to load config", err))

        // Scroll handler for glass effect
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Close menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    if (pathname.startsWith('/admin')) return null

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b border-transparent ${scrolled ? 'bg-[#050912]/80 backdrop-blur-xl border-white/5 shadow-2xl py-2' : 'bg-transparent py-4'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative w-10 h-10">
                            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full" />
                            <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-[#0f172a] to-[#050912] border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/clover-logo.png" alt="Clover" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-white leading-none group-hover:text-emerald-400 transition-colors">
                                CLOVER
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 tracking-[0.2em] leading-none">
                                STORE
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1">
                        <Link href="/" className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname === '/' ? 'text-white bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            Home
                        </Link>
                        <Link href="/check-transaction" className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname === '/check-transaction' ? 'text-white bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            Cek Transaksi
                        </Link>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Download App Dropdown */}
                        <div className="relative">
                            <button
                                onMouseEnter={() => setConfig((prev: any) => ({ ...prev, activeDropdown: 'download' }))}
                                onClick={() => setConfig((prev: any) => ({ ...prev, activeDropdown: prev?.activeDropdown === 'download' ? null : 'download' }))}
                                className="group px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 font-bold text-sm transition-all flex items-center gap-2"
                            >
                                <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                <span>App</span>
                            </button>

                            {/* Hover Bridge */}
                            {config?.activeDropdown === 'download' && (
                                <div
                                    className="absolute top-full right-0 w-48 pt-2"
                                    onMouseLeave={() => setConfig((prev: any) => ({ ...prev, activeDropdown: null }))}
                                >
                                    <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 backdrop-blur-xl">
                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">Download</div>
                                        <a href={config?.download_app?.royal_dream || '#'} target="_blank" className="block px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                            Royal Dream
                                        </a>
                                        <a href={config?.download_app?.domino_rp || '#'} target="_blank" className="block px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                            Domino RP
                                        </a>
                                        <a href={config?.download_app?.neo || '#'} target="_blank" className="block px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                            Neo
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hubungi CS Dropdown */}
                        <div className="relative">
                            <button
                                onMouseEnter={() => setConfig((prev: any) => ({ ...prev, activeDropdown: 'cs' }))}
                                onClick={() => setConfig((prev: any) => ({ ...prev, activeDropdown: prev?.activeDropdown === 'cs' ? null : 'cs' }))}
                                className="group px-5 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-2"
                            >
                                <span>Hubungi CS</span>
                                <ChevronDown size={16} className={`text-emerald-200 transition-transform duration-200 ${config?.activeDropdown === 'cs' ? 'rotate-180' : ''}`} />
                            </button>

                            {config?.activeDropdown === 'cs' && (
                                <div
                                    className="absolute top-full right-0 w-56 pt-2"
                                    onMouseLeave={() => setConfig((prev: any) => ({ ...prev, activeDropdown: null }))}
                                >
                                    <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 backdrop-blur-xl">
                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">Fast Response</div>
                                        <a
                                            href={`https://wa.me/${(config?.contacts?.whatsapp?.number || '').replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-colors group/item"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                                                <Phone size={14} />
                                            </div>
                                            WhatsApp
                                        </a>
                                        <a
                                            href={`https://t.me/${(config?.contacts?.telegram?.username || '').replace('https://t.me/', '').replace('@', '')}`}
                                            target="_blank"
                                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-colors group/item"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">
                                                <Send size={14} />
                                            </div>
                                            Telegram
                                        </a>
                                        <a href={config?.contacts?.live_chat?.url || '#'} target="_blank" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 rounded-lg transition-colors group/item">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover/item:bg-amber-500 group-hover/item:text-white transition-colors">
                                                <MessageCircle size={14} />
                                            </div>
                                            Live Chat
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 active:scale-95 transition-all"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed top-[64px] left-0 w-full h-[calc(100vh-64px)] bg-[#050912]/95 backdrop-blur-3xl border-t border-white/5 z-40 overflow-y-auto animate-in slide-in-from-right-10 duration-200">
                    <div className="p-6 space-y-8">
                        {/* Main Links */}
                        <div className="space-y-2">
                            <Link
                                href="/"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-5 py-4 rounded-2xl font-bold text-lg transition-all ${pathname === '/' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-300 border border-transparent'}`}
                            >
                                Home
                            </Link>
                            <Link
                                href="/check-transaction"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-5 py-4 rounded-2xl font-bold text-lg transition-all ${pathname === '/check-transaction' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-300 border border-transparent'}`}
                            >
                                Cek Transaksi
                            </Link>
                        </div>

                        {/* Mobile Download Game */}
                        <div>
                            <p className="px-1 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Download Game</p>
                            <div className="grid grid-cols-1 gap-2">
                                <a href={config?.download_app?.royal_dream || '#'} target="_blank" className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#0f172a] border border-white/5 text-gray-300 hover:border-pink-500/50 hover:text-pink-400 transition-all group">
                                    <span className="font-medium">Royal Dream</span>
                                    <Download size={18} className="text-gray-600 group-hover:text-pink-400" />
                                </a>
                                <a href={config?.download_app?.domino_rp || '#'} target="_blank" className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#0f172a] border border-white/5 text-gray-300 hover:border-purple-500/50 hover:text-purple-400 transition-all group">
                                    <span className="font-medium">Domino RP</span>
                                    <Download size={18} className="text-gray-600 group-hover:text-purple-400" />
                                </a>
                            </div>
                        </div>

                        {/* Mobile Contact CS */}
                        <div>
                            <p className="px-1 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Pusat Bantuan</p>
                            <div className="grid grid-cols-3 gap-3">
                                <a
                                    href={`https://wa.me/${(config?.contacts?.whatsapp?.number || '').replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#0f172a] border border-white/5 text-gray-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                                >
                                    <Phone size={24} />
                                    <span className="text-[10px] font-bold">WhatsApp</span>
                                </a>
                                <a
                                    href={`https://t.me/${(config?.contacts?.telegram?.username || '').replace('https://t.me/', '').replace('@', '')}`}
                                    target="_blank"
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#0f172a] border border-white/5 text-gray-400 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all"
                                >
                                    <Send size={24} />
                                    <span className="text-[10px] font-bold">Telegram</span>
                                </a>
                                <a href={config?.contacts?.live_chat?.url || '#'} target="_blank" className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#0f172a] border border-white/5 text-gray-400 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all">
                                    <MessageCircle size={24} />
                                    <span className="text-[10px] font-bold">Live Chat</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
