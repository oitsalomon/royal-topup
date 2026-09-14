'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard, User, ArrowLeftRight, FileText, SlidersHorizontal,
    Landmark, ArrowDownToLine, Receipt, Crown, ScrollText, Wallet,
    Gamepad2, Package, Settings, Shield, LogOut,
    ChevronDown, X
} from 'lucide-react'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

interface NavSection {
    title: string | null
    master?: boolean
    items: {
        href: string
        label: string
        icon: any
        badge?: string
    }[]
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: null,
        items: [
            { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
            { href: '/admin/members', label: 'Member CRM', icon: User, badge: '1.5K' },
        ]
    },
    {
        title: 'Transaksi',
        items: [
            { href: '/admin/transactions', label: 'Top Up / WD', icon: ArrowLeftRight },
            { href: '/admin/manual-transaction', label: 'Input Cepat', icon: FileText },
            { href: '/admin/adjustments', label: 'Adjustment', icon: SlidersHorizontal },
        ]
    },
    {
        title: 'Keuangan & Kas',
        items: [
            { href: '/admin/banks', label: 'Bank & Chip', icon: Landmark },
            { href: '/admin/transfers', label: 'Transfer Bank', icon: ArrowDownToLine },
            { href: '/admin/biaya', label: 'Biaya Operasional', icon: Receipt },
            { href: '/admin/dcbos', label: 'DC Bos (Setoran)', icon: Crown },
            { href: '/admin/rekap', label: 'Rekap Arus Kas', icon: ScrollText },
        ]
    },
    {
        title: 'Privat (Master)',
        master: true,
        items: [
            { href: '/admin/bosreport', label: 'Laporan Bos', icon: LayoutDashboard },
            { href: '/admin/payroll', label: 'Gaji & Kasbon', icon: Wallet },
        ]
    },
    {
        title: 'Katalog Web Toko',
        items: [
            { href: '/admin/packages', label: 'Manajemen Paket', icon: Package },
            { href: '/admin/games', label: 'Kelola Game', icon: Gamepad2 },
            { href: '/admin/staff', label: 'Staff & CS', icon: Shield },
            { href: '/admin/logs', label: 'Log Aktivitas', icon: FileText },
            { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
        ]
    }
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user')
            if (stored) {
                setCurrentUser(JSON.parse(stored))
            }
        } catch {}
    }, [])

    const isMaster = Boolean(
        currentUser && (
            currentUser.role === 'SUPER_ADMIN' ||
            currentUser.username?.toLowerCase() === 'salomon' ||
            currentUser.permissions?.includes('MASTER')
        )
    )

    const visibleSections = NAV_SECTIONS.filter(sec => !sec.master || isMaster)

    const toggleSection = (title: string) => {
        setCollapsed(prev => ({ ...prev, [title]: !prev[title] }))
    }

    const handleLogout = () => {
        if (confirm('Apakah anda yakin ingin logout?')) {
            localStorage.removeItem('user')
            router.push('/admin/login')
        }
    }

    const displayName = currentUser?.username || 'Salomon'
    const roleBadge = isMaster ? 'OWNER' : (currentUser?.role || 'STAFF')

    return (
        <>
            {/* Mobile / Small Screen Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-200"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container: w-64 shrink-0, fixed below lg, static on lg */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#131417] border-r border-[#26282f]
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                shadow-2xl select-none
            `}>
                <div className="p-4 flex flex-col h-full overflow-hidden">
                    {/* Header Brand */}
                    <div className="mb-4 flex items-center justify-between px-2 pb-3 border-b border-[#26282f] shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#f5b301]/10 border border-[#f5b301]/30 flex items-center justify-center text-[#f5b301] shadow-lg shadow-[#f5b301]/5 shrink-0">
                                <Crown size={20} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-extrabold text-[#f3f5f8] tracking-tight truncate">Royal Clover</h1>
                                <p className="text-[10px] font-bold text-[#f5b301] uppercase tracking-wider">
                                    Ops Console
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="lg:hidden p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                        {visibleSections.map((sec, idx) => {
                            const isClosed = sec.title ? collapsed[sec.title] : false

                            return (
                                <div key={idx} className="space-y-1">
                                    {sec.title && (
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(sec.title!)}
                                            className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7e8593] hover:text-[#f3f5f8] transition-colors"
                                        >
                                            <span className="truncate">{sec.title}</span>
                                            <ChevronDown
                                                size={13}
                                                className={`shrink-0 transition-transform duration-200 ${isClosed ? '-rotate-90' : ''}`}
                                            />
                                        </button>
                                    )}

                                    {!isClosed && (
                                        <div className="space-y-0.5">
                                            {sec.items.map((item) => {
                                                const Icon = item.icon
                                                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        prefetch={false}
                                                        onClick={() => onClose()}
                                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                                            isActive
                                                                ? 'bg-[#f5b301]/15 text-[#f5b301] font-semibold border border-[#f5b301]/30 shadow-sm'
                                                                : 'text-[#d6dae1] hover:bg-[#1b1d22] hover:text-white'
                                                        }`}
                                                    >
                                                        <Icon size={17} className={`shrink-0 ${isActive ? 'text-[#f5b301]' : 'text-[#7e8593]'}`} />
                                                        <span className="flex-1 truncate">{item.label}</span>
                                                        {item.badge && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f5b301]/20 text-[#f5b301] border border-[#f5b301]/30 shrink-0">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </nav>

                    {/* Footer User Profile / Logout */}
                    <div className="pt-3 mt-2 border-t border-[#26282f] space-y-2 shrink-0">
                        <div className="px-3 py-2 rounded-lg bg-[#1b1d22] border border-[#26282f] flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="text-xs font-bold text-[#f3f5f8] truncate" title={displayName}>
                                    {displayName}
                                </span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                isMaster ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                                {roleBadge}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                            <LogOut size={15} className="shrink-0" />
                            <span>Keluar dari Panel</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
