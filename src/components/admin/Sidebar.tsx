'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation' // Correct Import
import { LayoutDashboard, Receipt, FileText, LogOut, Settings, Shield, Wallet, Coins, User, Gamepad2, Package, TrendingUp } from 'lucide-react'

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
        <div className="w-72 bg-[#0a0f1c]/80 backdrop-blur-2xl border-r border-white/5 min-h-screen p-6 flex flex-col relative z-20">
            <div className="mb-12 flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
                    <Shield className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide font-outfit">ADMIN</h1>
                    <p className="text-[10px] text-cyan-400 font-medium tracking-widest uppercase">Control Panel v2.3</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname.startsWith(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/5 text-cyan-400'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full" />
                            )}
                            <Icon size={22} className={`transition-colors duration-300 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'group-hover:text-white'}`} />
                            <span className="font-medium tracking-wide">{link.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all mt-auto group border border-transparent hover:border-red-500/10"
            >
                <LogOut size={22} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Logout</span>
            </button>
        </div>
    )
}
