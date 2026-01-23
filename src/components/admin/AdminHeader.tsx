'use client'

import { Bell, Menu, Search } from 'lucide-react'


interface AdminHeaderProps {
    onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#0a0f1c]/80 backdrop-blur-md border-b border-white/5">
            {/* Left: Mobile Toggle & Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="md:hidden font-bold text-white text-lg tracking-wide">
                    CLOVER <span className="text-emerald-500 text-xs align-top">ADMIN</span>
                </div>

                {/* Desktop Search (Optional Filler) */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-black/20 border border-white/5 rounded-full text-gray-400 text-sm w-64 focus-within:border-emerald-500/30 transition-colors">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <Bell size={20} />
                </button>

                {/* Profile Placeholder (Optional) */}
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                    AD
                </div>
            </div>
        </header>
    )
}
