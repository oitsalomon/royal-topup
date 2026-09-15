'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard, User, ArrowLeftRight, FileText, SlidersHorizontal,
    Landmark, ArrowDownToLine, Receipt, Crown, ScrollText, Wallet,
    Gamepad2, Package, Settings, Shield, LogOut,
    ChevronDown, X, Clock, AlertTriangle
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
            { href: '/admin/cs-sessions', label: 'Riwayat Shift CS', icon: Clock },
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
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

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

    const executeLogout = async (closeShift: boolean) => {
        setLoggingOut(true)
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ closeShift })
            })
        } catch (err) {
            console.error('Logout error:', err)
        }
        localStorage.removeItem('user')
        localStorage.removeItem('royal_member')
        window.location.href = '/admin/login'
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
                fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[var(--rc-panel)] border-r border-[var(--rc-border)]
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                shadow-2xl select-none
            `}>
                <div className="p-4 flex flex-col h-full overflow-hidden">
                    {/* Header Brand */}
                    <div className="mb-4 flex items-center justify-between px-2 pb-3 border-b border-[var(--rc-border)] shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[var(--rc-accent)]/10 border border-[var(--rc-accent)]/30 flex items-center justify-center text-[var(--rc-accent)] shadow-lg shrink-0">
                                <Crown size={20} strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-extrabold text-[var(--rc-text)] tracking-tight truncate">Royal Clover</h1>
                                <p className="text-[10px] font-bold text-[var(--rc-accent)] uppercase tracking-wider">
                                    Ops Console
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="lg:hidden p-1.5 rounded-lg bg-[var(--rc-panel2)] text-[var(--rc-muted)] hover:text-[var(--rc-text)] transition-colors shrink-0"
                        >
                            <X size={18} strokeWidth={1.5} />
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
                                            className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--rc-muted)] hover:text-[var(--rc-text)] transition-colors"
                                        >
                                            <span className="truncate">{sec.title}</span>
                                            <ChevronDown
                                                size={13}
                                                strokeWidth={1.5}
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
                                                                ? 'bg-[var(--rc-accent)]/15 text-[var(--rc-accent)] font-semibold border border-[var(--rc-accent)]/30 shadow-sm'
                                                                : 'text-[var(--rc-text2)] hover:bg-[var(--rc-panel2)] hover:text-[var(--rc-text)]'
                                                        }`}
                                                    >
                                                        <Icon size={17} strokeWidth={1.5} className={`shrink-0 ${isActive ? 'text-[var(--rc-accent)]' : 'text-[var(--rc-muted)]'}`} />
                                                        <span className="flex-1 truncate">{item.label}</span>
                                                        {item.badge && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--rc-accent)]/20 text-[var(--rc-accent)] border border-[var(--rc-accent)]/30 shrink-0">
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
                    <div className="pt-3 mt-2 border-t border-[var(--rc-border)] space-y-2 shrink-0">
                        <div className="px-3 py-2 rounded-lg bg-[var(--rc-panel2)] border border-[var(--rc-border)] flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="text-xs font-bold text-[var(--rc-text)] truncate" title={displayName}>
                                    {displayName}
                                </span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                isMaster ? 'bg-amber-500/20 text-amber-500 font-extrabold' : 'bg-blue-500/20 text-blue-400 font-extrabold'
                            }`}>
                                {roleBadge}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                        >
                            <LogOut size={15} strokeWidth={1.5} className="shrink-0" />
                            <span>Keluar dari Panel</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-[var(--rc-panel)] border border-[var(--rc-border)] shadow-2xl p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                                <Clock size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[var(--rc-text)]">Selesai Kerja & Tutup Shift?</h3>
                                <p className="text-xs text-[var(--rc-muted)]">Pilih status shift sebelum keluar</p>
                            </div>
                        </div>

                        <p className="text-xs text-[var(--rc-text2)] leading-relaxed bg-[var(--rc-panel2)] p-3 rounded-xl border border-[var(--rc-border)]">
                            Jika Anda memilih <b>Hanya Logout</b>, sesi shift Anda tetap aktif sehingga saat Anda login kembali, Anda akan melanjutkan shift yang sama.
                        </p>

                        <div className="space-y-2 pt-1">
                            <button
                                type="button"
                                disabled={loggingOut}
                                onClick={() => executeLogout(true)}
                                className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                                {loggingOut ? 'Memproses...' : 'Ya, Selesai Kerja & Tutup Shift'}
                            </button>

                            <button
                                type="button"
                                disabled={loggingOut}
                                onClick={() => executeLogout(false)}
                                className="w-full py-2.5 px-3 rounded-xl bg-[var(--rc-panel2)] hover:bg-[var(--rc-border)] disabled:opacity-50 text-[var(--rc-text)] font-semibold text-xs border border-[var(--rc-border)] transition-colors cursor-pointer"
                            >
                                {loggingOut ? 'Memproses...' : 'Tidak, Hanya Logout (Shift Tetap Aktif)'}
                            </button>

                            <button
                                type="button"
                                disabled={loggingOut}
                                onClick={() => setShowLogoutModal(false)}
                                className="w-full py-2 text-center text-xs text-[var(--rc-muted)] hover:text-[var(--rc-text)] transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
