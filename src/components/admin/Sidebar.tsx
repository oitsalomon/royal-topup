'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, FileText, LogOut, Settings, Shield, Wallet, Coins, User, Users, Gamepad2, Package, TrendingUp, Gift, Ticket } from 'lucide-react'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()

    // ... handleLogout and links array remain same ...

    // Close sidebar on route change (mobile)
    // We can't easily do useEffect here without adding it validly. 
    // Let's assume parent handles close or we add simple logic.

    const handleLogout = () => {
        if (confirm('Apakah anda yakin ingin logout?')) {
            localStorage.removeItem('user')
            router.push('/admin/login')
        }
    }

    const links = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/transactions', label: 'Transaksi', icon: Receipt },
        { href: '/admin/manual-transaction', label: 'Input Manual', icon: FileText },
        { href: '/admin/games', label: 'Kelola Game', icon: Gamepad2 },
        { href: '/admin/packages', label: 'Manajemen Paket', icon: Package },
        { href: '/admin/promos', label: 'Kelola Promo', icon: Gift },
        { href: '/admin/banks', label: 'Panel Bank', icon: Wallet },
        { href: '/admin/withdraw-methods', label: 'Tujuan Withdraw', icon: Receipt },
        { href: '/admin/game-accounts', label: 'Panel ID', icon: Coins },
        { href: '/admin/members', label: 'Member / User', icon: User },
        { href: '/admin/referrals', label: 'Monitoring Referral', icon: Users }, // New Link
        { href: '/admin/referral-withdrawals', label: 'Withdraw Referral', icon: Wallet }, // New Dedicated Page
        { href: '/admin/lottery', label: 'Lottery System', icon: Ticket }, // New Link
        { href: '/admin/staff', label: 'Staff', icon: Shield },
        { href: '/admin/adjustments', label: 'Riwayat Adjustment', icon: Coins },
        { href: '/admin/transfers', label: 'Riwayat Transfer', icon: TrendingUp },
        { href: '/admin/logs', label: 'Log Aktivitas', icon: FileText },
        { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
    ]

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-72 bg-[#0a0f1c]/95 border-r border-white/10 backdrop-blur-xl
                transform transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static md:h-screen md:flex md:flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                shadow-2xl
            `}>
                <div className="p-6 flex flex-col h-full overflow-hidden">
                    <div className="mb-8 flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/clover-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-wide font-outfit">CLOVER</h1>
                                <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                                    Admin v2.3
                                </p>
                            </div>
                        </div>
                        {/* Mobile Close Button - Explicit X */}
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
                        {links.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname.startsWith(link.href)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => onClose()} // Close on click (mobile)
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-emerald-900/40 to-emerald-900/20 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/10'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-300'} />
                                    <span className={`text-sm font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>{link.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="pt-6 mt-4 border-t border-[#1a2332]">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/10"
                        >
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <LogOut size={18} />
                            </div>
                            <span className="font-bold text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
