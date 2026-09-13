'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { User, Flame, FileText, HelpCircle, PhoneCall, LogOut } from 'lucide-react'

export function SiteHeader() {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    if (pathname?.startsWith('/admin')) return null

    return (
        <header className="w-full bg-[#0d0d0f] border-b border-[#8a6d38]/20 pt-6 pb-4 px-3 sm:px-6">
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-3.5">
                
                {/* Center-Aligned Logo + Brand */}
                <Link href="/" className="flex flex-col items-center justify-center space-y-2.5 group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0d0d0f] border-2 border-[#c5a369] flex items-center justify-center overflow-hidden shadow-[0_0_22px_rgba(197,163,105,0.25)] group-hover:border-[#e8c883] group-hover:scale-105 transition-all">
                        <Image
                            src="/images/clover-logo.webp"
                            alt="Royal Clover"
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            priority
                        />
                    </div>
                    <div className="text-center">
                        <span className="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-[#c5a369] block leading-tight">
                            Royal Clover
                        </span>
                        <span className="text-xs sm:text-sm font-inter text-[#8a6d38] block mt-0.5">
                            Pusat Chip Royal Dream
                        </span>
                    </div>
                </Link>

                {/* Clean Navigation Pills */}
                <nav className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 text-xs font-poppins font-semibold">
                    <Link
                        href="/"
                        className={`px-3 py-1.5 rounded-full transition-colors ${
                            pathname === '/' || pathname.startsWith('/topup') || pathname.startsWith('/preview-topup')
                                ? 'bg-[#17171a] text-[#f3ecd8] border border-[#c5a369]'
                                : 'bg-[#17171a]/70 text-[#a89f8a] border border-[#8a6d38]/30 hover:text-[#f3ecd8] hover:border-[#8a6d38]'
                        }`}
                    >
                        Top Up
                    </Link>

                    <Link
                        href="/withdraw/royal-dream"
                        className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                            pathname.startsWith('/withdraw')
                                ? 'bg-[#17171a] text-[#e8c883] border border-[#e8c883]'
                                : 'bg-[#17171a]/70 text-[#e8c883] border border-[#8a6d38]/40 hover:border-[#e8c883]'
                        }`}
                    >
                        <Flame size={13} className="text-[#e8c883]" />
                        <span>Bongkaran Auto</span>
                    </Link>

                    <Link
                        href="/check-transaction"
                        className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                            pathname === '/check-transaction'
                                ? 'bg-[#17171a] text-[#f3ecd8] border border-[#c5a369]'
                                : 'bg-[#17171a]/70 text-[#a89f8a] border border-[#8a6d38]/30 hover:text-[#f3ecd8] hover:border-[#8a6d38]'
                        }`}
                    >
                        <FileText size={13} className="text-[#c5a369]" />
                        <span>Cek Transaksi</span>
                    </Link>

                    <Link
                        href="/about"
                        className={`px-3 py-1.5 rounded-full transition-colors ${
                            pathname === '/about'
                                ? 'bg-[#17171a] text-[#f3ecd8] border border-[#c5a369]'
                                : 'bg-[#17171a]/70 text-[#a89f8a] border border-[#8a6d38]/30 hover:text-[#f3ecd8] hover:border-[#8a6d38]'
                        }`}
                    >
                        Tentang Kami
                    </Link>

                    <Link
                        href="/contact"
                        className={`px-3 py-1.5 rounded-full transition-colors ${
                            pathname === '/contact'
                                ? 'bg-[#17171a] text-[#f3ecd8] border border-[#c5a369]'
                                : 'bg-[#17171a]/70 text-[#a89f8a] border border-[#8a6d38]/30 hover:text-[#f3ecd8] hover:border-[#8a6d38]'
                        }`}
                    >
                        Kontak
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-1.5 pl-1">
                            <span className="text-[11px] font-inter text-[#f3ecd8] px-2 py-1 rounded bg-[#17171a] border border-[#8a6d38]/40">
                                {user.username}
                            </span>
                            <button
                                onClick={logout}
                                title="Logout"
                                className="p-1 rounded-full text-[#a89f8a] hover:text-red-400 transition-colors"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                                pathname === '/login' || pathname === '/register'
                                    ? 'bg-[#3fa46a] text-white'
                                    : 'bg-[#17171a] text-[#f3ecd8] border border-[#8a6d38]/60 hover:border-[#c5a369]'
                            }`}
                        >
                            <User size={13} />
                            <span>Member Login</span>
                        </Link>
                    )}
                </nav>

            </div>
        </header>
    )
}

export default SiteHeader
