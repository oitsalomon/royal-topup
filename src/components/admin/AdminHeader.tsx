'use client'

import { useState, useEffect } from 'react'
import { Menu, Crown } from 'lucide-react'
import ThemeSwitcher from './ThemeSwitcher'

interface AdminHeaderProps {
    onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const [userName, setUserName] = useState('Admin')
    const [userRole, setUserRole] = useState('CS')

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user')
            if (stored) {
                const u = JSON.parse(stored)
                if (u.username) setUserName(u.username)
                if (u.role === 'SUPER_ADMIN' || u.username?.toLowerCase() === 'salomon') {
                    setUserRole('Master')
                } else {
                    setUserRole(u.role || 'CS')
                }
            }
        } catch {}
    }, [])

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[var(--rc-panel)] border-b border-[var(--rc-border)] shrink-0 transition-colors">
            {/* Left: Mobile/Tablet Toggle & Title */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-xl bg-[var(--rc-panel2)] border border-[var(--rc-border)] text-[var(--rc-text2)] hover:text-[var(--rc-text)] transition-colors shrink-0"
                    aria-label="Open navigation menu"
                >
                    <Menu size={18} strokeWidth={1.5} />
                </button>
                <div className="lg:hidden flex items-center gap-2 font-extrabold text-[var(--rc-text)] text-base tracking-wide">
                    <div className="w-7 h-7 rounded-lg bg-[var(--rc-accent)]/10 border border-[var(--rc-accent)]/30 flex items-center justify-center text-[var(--rc-accent)] shrink-0">
                        <Crown size={15} strokeWidth={1.5} />
                    </div>
                    <span>Royal Clover</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <ThemeSwitcher />

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--rc-panel2)] border border-[var(--rc-border)] text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[var(--rc-text)] font-bold hidden sm:inline">{userName}</span>
                    <span className="text-[10px] text-[var(--rc-accent)] font-extrabold uppercase">{userRole}</span>
                </div>
            </div>
        </header>
    )
}
