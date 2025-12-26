'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, FileText, LogOut, Settings, Shield, Wallet, Coins, User, Gamepad2, Package, TrendingUp, Gift } from 'lucide-react'

export default function Sidebar() {
    const router = useRouter()
    const pathname = usePathname()

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
        { href: '/admin/staff', label: 'Staff', icon: User },
        { href: '/admin/adjustments', label: 'Riwayat Adjustment', icon: Coins },
        { href: '/admin/transfers', label: 'Riwayat Transfer', icon: TrendingUp },
        { href: '/admin/logs', label: 'Log Aktivitas', icon: FileText },
        { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
    ]

    return (
        <div className="w-72 bg-[#050912]/95 backdrop-blur-xl border-r border-[#1a2332] min-h-screen p-6 flex flex-col relative z-20 shadow-2xl">
            <div className="mb-10 flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/clover-logo.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-wide font-outfit">CLOVER</h1>
                    <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Admin v2.3
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname.startsWith(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${isActive
                                ? 'bg-gradient-to-r from-emerald-900/30 to-green-900/10 text-emerald-400 shadow-inner shadow-emerald-500/5'
                                : 'text-gray-400 hover:bg-[#0f172a] hover:text-white'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                            )}
                            <Icon size={20} className={`transition-all duration-300 ${isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'group-hover:text-emerald-300'}`} />
                            <span className={`text-sm font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>{link.label}</span>

                            {isActive && (
                                <div className="absolute inset-0 bg-emerald-400/5 rounded-xl animate-pulse pointer-events-none" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="pt-6 mt-4 border-t border-[#1a2332]">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group border border-transparent hover:border-red-500/10"
                >
                    <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-bold text-sm">Logout</span>
                </button>
            </div>
        </div>
    )
}
