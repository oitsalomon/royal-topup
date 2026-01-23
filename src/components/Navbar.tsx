'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, User, ChevronDown, Phone, Send, MessageCircle, Download, X, LogIn, LogOut, CreditCard, Trophy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'

export default function Navbar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [config, setConfig] = useState<any>(null)
    const [scrolled, setScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
                        {/* Auth Buttons */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onMouseEnter={() => setConfig((prev: any) => ({ ...prev, activeDropdown: 'user' }))}
                                    onClick={() => setConfig((prev: any) => ({ ...prev, activeDropdown: prev?.activeDropdown === 'user' ? null : 'user' }))}
                                    className="group px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all flex items-center gap-2"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
                                        {user.level ? user.level[0] : 'M'}
                                    </div>
                                    <span>{user.username}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${config?.activeDropdown === 'user' ? 'rotate-180' : ''}`} />
                                </button>

                                {config?.activeDropdown === 'user' && (
                                    <div
                                        className="absolute top-full right-0 w-48 pt-2"
                                        onMouseLeave={() => setConfig((prev: any) => ({ ...prev, activeDropdown: null }))}
                                    >
                                        <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 backdrop-blur-xl">
                                            <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                                <User size={14} /> Profil Saya
                                            </Link>
                                            <Link href="/profile/referral" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-amber-500">
                                                <Users size={14} /> Referral & Bonus
                                            </Link>
                                            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                                                <LogOut size={14} /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-0.5"
                                >
                                    Daftar
                                </Link>
                            </div>
                        )}

                        {/* Hubungi CS Dropdown */}
                        <div className="relative">
                            <button
                                onMouseEnter={() => setConfig((prev: any) => ({ ...prev, activeDropdown: 'cs' }))}
                                onClick={() => setConfig((prev: any) => ({ ...prev, activeDropdown: prev?.activeDropdown === 'cs' ? null : 'cs' }))}
                                className="group px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-700/10 hover:from-emerald-500/20 hover:to-emerald-700/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-all flex items-center gap-2"
                            >
                                <Phone size={16} />
                                <span className="hidden lg:inline">CS</span>
                            </button>

                            {config?.activeDropdown === 'cs' && (
                                <div
                                    className="absolute top-full right-0 w-56 pt-2"
                                    onMouseLeave={() => setConfig((prev: any) => ({ ...prev, activeDropdown: null }))}
                                >
                                    <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 backdrop-blur-xl">
                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">Fast Response</div>
                                        {/* ... Contact Links (Same as before) ... */}
                                        <a
                                            href={`https://wa.me/${(() => {
                                                const num = (config?.contacts?.whatsapp?.number || '').replace(/[^0-9]/g, '')
                                                return num.startsWith('0') ? '62' + num.slice(1) : num
                                            })()}`}
                                            target="_blank"
                                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-colors group/item"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Phone size={14} /></div> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        {!user && (
                            <>
                                <Link
                                    href="/login"
                                    className="px-3 py-2 rounded-lg bg-white/5 text-bold text-[10px] text-white border border-white/10"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-3 py-2 rounded-lg bg-emerald-600 text-bold text-[10px] text-white shadow-lg shadow-emerald-500/20"
                                >
                                    Daftar
                                </Link>
                            </>
                        )}
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
                        {user && (
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-lg font-bold">
                                    {user.level ? user.level[0] : 'M'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{user.username}</h3>
                                    <p className="text-xs text-cyan-400">{user.level || 'Member'}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-5 py-4 rounded-2xl bg-white/5 text-gray-300 hover:text-white">Home</Link>
                            <Link href="/check-transaction" onClick={() => setIsMobileMenuOpen(false)} className="block px-5 py-4 rounded-2xl bg-white/5 text-gray-300 hover:text-white">Cek Transaksi</Link>
                            {user && (
                                <>
                                    <Link href="/profile/loyalty" onClick={() => setIsMobileMenuOpen(false)} className="block px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500/20">
                                        <div className="flex items-center gap-2">
                                            <Trophy size={18} />
                                            Loyalty & Undian
                                        </div>
                                    </Link>
                                    <Link href="/profile/referral" onClick={() => setIsMobileMenuOpen(false)} className="block px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20">
                                        <div className="flex items-center gap-2">
                                            <Users size={18} />
                                            Referral & Bonus
                                        </div>
                                    </Link>
                                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-5 py-4 rounded-2xl bg-white/5 text-gray-300 hover:text-white">Profil Saya</Link>
                                </>
                            )}
                        </div>

                        {user ? (
                            <button onClick={() => { logout(); setIsMobileMenuOpen(false) }} className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 font-bold border border-red-500/20">Logout</button>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-4 text-center rounded-2xl bg-white/5 text-white font-bold border border-white/10">Masuk</Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="py-4 text-center rounded-2xl bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/20">Daftar</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
