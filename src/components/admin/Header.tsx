import { useState, useEffect } from 'react'
import { Bell, Search, User } from 'lucide-react'

interface HeaderProps {
    title: string
    subtitle: string
}

export default function Header({ title, subtitle }: HeaderProps) {
    const [user, setUser] = useState<{ username: string, role: string } | null>(null)

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const userData = JSON.parse(userStr)
                setUser(userData)
            }
        } catch (e) {
            console.error('Failed to parse user from local storage')
        }
    }, [])

    return (
        <header className="sticky top-0 z-10 bg-[#0a0f1c]/80 backdrop-blur-xl border-b border-white/5 px-8 py-5 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                </div>

                <div className="h-8 w-px bg-white/10" />

                <button className="relative group">
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <Bell className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white">{user?.username || 'Admin'}</p>
                        <p className="text-xs text-gray-400">{user?.role || 'Guest'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    )
}
