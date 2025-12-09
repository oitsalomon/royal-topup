'use client'

import Sidebar from '@/components/admin/Sidebar'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    // Check if the current route is the login page
    const isLoginPage = pathname === '/admin/login'

    return (
        <div className="flex min-h-screen bg-[#0a0f1c]">
            {!isLoginPage && <Sidebar />}
            <main className={`flex-1 overflow-y-auto relative z-10 ${!isLoginPage ? 'p-8' : ''}`}>
                {children}
            </main>
        </div>
    )
}
