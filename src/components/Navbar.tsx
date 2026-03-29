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
        fetch('/api/config', { cache: 'no-store' })
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
        <nav className={`fixed top-0 w-full z-50 transition-all duration-700 border-b ${scrolled ? 'bg-[#050912]/80 backdrop-blur-2xl border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2' : 'bg-transparent border-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-4 group cursor-pointer">
                        <div className="relative w-11 h-11">
                            <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 rounded-full" />
                            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#13162a] to-[#0d0f1a] border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/clover-logo.png" alt="Clover" className="w-7 h-7 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] relative z-10" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="v4-font-syne text-2xl font-black tracking-tighter text-white leading-none group-hover:text-purple-400 transition-colors uppercase">
                                ROYAL<span className="v4-text-gradient">CLOVER</span>
                            </span>
                            <span className="text-[9px] font-black text-cyan-400 tracking-[0.4em] leading-none mt-1 opacity-80 uppercase">
                                Premium Digital
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                        <Link href="/" className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${pathname === '/' ? 'text-white bg-purple-600 shadow-lg shadow-purple-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            Home
                        </Link>

                        <Link href="/check-transaction" className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${pathname === '/check-transaction' ? 'text-white bg-purple-600 shadow-lg shadow-purple-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            Cek Status
                        </Link>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        {/* Auth Buttons */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onMouseEnter={() => setConfig((prev: any) => ({ ...prev, activeDropdown: 'user' }))}
                                    onClick={() => setConfig((prev: any) => ({ ...prev, activeDropdown: prev?.activeDropdown === 'user' ? null : 'user' }))}
                                    className="group px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs transition-all flex items-center gap-3"
                                >
                                    <div className="w-7 h-7 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-[10px] font-black border border-white/10 group-hover:scale-110 transition-transform">
                                        {user.level ? user.level[0] : 'M'}
                                    </div>
                                    <span className="uppercase tracking-widest">{user.username}</span>
                                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${config?.activeDropdown === 'user' ? 'rotate-180' : ''}`} />
                                </button>

                                {config?.activeDropdown === 'user' && (
                                    <div
                                        className="absolute top-full right-0 w-56 pt-3 animate-in fade-in slide-in-from-top-2 duration-300"
                                        onMouseLeave={() => setConfig((prev: any) => ({ ...prev, activeDropdown: null }))}
                                    >
                                        <div className="bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-2 backdrop-blur-2xl">
                                            <div className="px-4 py-3 border-b border-white/5 mb-2">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sultan Level</p>
                                                <p className="text-xs font-black text-cyan-400 uppercase tracking-tight">{user.level || 'Silver'} Member</p>
                                            </div>
                                            <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-purple-600 hover:text-white rounded-2xl transition-all mb-1">
                                                <User size={14} /> Profil Saya
                                            </Link>
                                            <Link href="/profile/referral" className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-600 hover:text-white rounded-2xl transition-all mb-1">
                                                <Users size={14} /> Referral
                                            </Link>
                                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all text-left">
                                                <LogOut size={14} /> Keluar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/login" className="text-xs font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-colors pr-2">
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="v4-btn-main px-6 py-3 rounded-2xl text-white font-black text-xs tracking-widest uppercase shadow-xl relative overflow-hidden group"
                                >
                                    <span className="relative z-10">Daftar Sultan</span>
                                </Link>
                            </div>
                        )}

                        {/* CS Support */}
                        <div className="relative">
                            <button
                                onMouseEnter={() => setConfig((prev: any) => ({ ...prev, activeDropdown: 'cs' }))}
                                onClick={() => setConfig((prev: any) => ({ ...prev, activeDropdown: prev?.activeDropdown === 'cs' ? null : 'cs' }))}
                                className="group w-10 h-10 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/10"
                            >
                                <MessageCircle size={18} />
                            </button>

                            {config?.activeDropdown === 'cs' && (
                                <div
                                    className="absolute top-full right-0 w-64 pt-3 animate-in fade-in slide-in-from-top-2 duration-300"
                                    onMouseLeave={() => setConfig((prev: any) => ({ ...prev, activeDropdown: null }))}
                                >
                                    <div className="bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-2 backdrop-blur-2xl">
                                        <div className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] border-b border-white/5 mb-2 text-center">Support Center 24/7</div>
                                        <a
                                            href={`https://wa.me/${(() => {
                                                const num = (config?.contacts?.whatsapp?.number || '').replace(/[^0-9]/g, '')
                                                return num.startsWith('0') ? '62' + num.slice(1) : num
                                            })()}`}
                                            target="_blank"
                                            className="flex items-center gap-4 px-4 py-4 text-xs font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all group/item"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover/item:bg-white/20 transition-all"><Phone size={16} /></div> 
                                            WhatsApp
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-3">
                        {!user && (
                            <Link
                                href="/login"
                                className="px-4 py-2.5 rounded-xl v4-btn-main text-[10px] font-black text-white uppercase tracking-widest shadow-lg"
                            >
                                Login
                            </Link>
                        )}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 text-white border border-white/10 active:scale-95 transition-all"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 top-[64px] bg-[#050912]/98 backdrop-blur-3xl z-40 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
                    <div className="p-8 space-y-10 pb-20">
                        {user && (
                            <div className="v4-glass p-6 rounded-[32px] flex items-center gap-5 border-purple-500/20 shadow-2xl shadow-purple-500/10">
                                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-xl font-black border border-white/20">
                                    {user.level ? user.level[0] : 'M'}
                                </div>
                                <div>
                                    <h3 className="v4-font-syne text-xl font-black text-white uppercase tracking-tight">{user.username}</h3>
                                    <div className="inline-flex px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-1">
                                        {user.level || 'Bronze'} Member
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`block px-7 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] border transition-all ${pathname === '/' ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-500/20' : 'bg-white/5 border-white/5 text-gray-400'}`}>Home</Link>
                            <Link href="/check-transaction" onClick={() => setIsMobileMenuOpen(false)} className={`block px-7 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] border transition-all ${pathname === '/check-transaction' ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-500/20' : 'bg-white/5 border-white/5 text-gray-400'}`}>Cek Transaksi</Link>
                            {user && (
                                <>
                                    <div className="h-px bg-white/5 my-4 mx-4"></div>
                                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-7 py-5 rounded-[24px] bg-white/5 border border-white/5 text-gray-400 font-black text-[11px] uppercase tracking-[0.2em]">Profil Saya</Link>
                                    <Link href="/profile/referral" onClick={() => setIsMobileMenuOpen(false)} className="block px-7 py-5 rounded-[24px] bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 font-black text-[11px] uppercase tracking-[0.2em]">Referral & Bonus</Link>
                                </>
                            )}
                        </div>

                        {user ? (
                            <button onClick={() => { logout(); setIsMobileMenuOpen(false) }} className="w-full py-5 rounded-[24px] bg-red-500/10 text-red-500 font-black text-[11px] uppercase tracking-[0.3em] border border-red-500/20">Keluar Akun</button>
                        ) : (
                            <div className="grid grid-cols-2 gap-5 pt-4">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-5 text-center rounded-[24px] bg-white/5 text-white font-black text-[11px] uppercase tracking-[0.3em] border border-white/10">Masuk</Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="v4-btn-main py-5 text-center rounded-[24px] text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl">Daftar</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
