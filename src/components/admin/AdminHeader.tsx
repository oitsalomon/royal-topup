'use client'

import { Bell, Menu, Crown } from 'lucide-react'

interface AdminHeaderProps {
    onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#131417] border-b border-[#26282f] shrink-0">
            {/* Left: Mobile/Tablet Toggle & Title */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-xl bg-[#1b1d22] border border-[#26282f] text-gray-300 hover:bg-[#26282f] hover:text-white transition-colors shrink-0"
                    aria-label="Open navigation menu"
                >
                    <Menu size={18} />
                </button>
                <div className="lg:hidden flex items-center gap-2 font-extrabold text-white text-base tracking-wide">
                    <div className="w-7 h-7 rounded-lg bg-[#f5b301]/10 border border-[#f5b301]/30 flex items-center justify-center text-[#f5b301] shrink-0">
                        <Crown size={15} />
                    </div>
                    <span>Royal Clover</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b1d22] border border-[#26282f] text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[#f3f5f8] font-bold hidden sm:inline">Salomon</span>
                    <span className="text-[10px] text-[#f5b301] font-extrabold uppercase">Master</span>
                </div>
            </div>
        </header>
    )
}
