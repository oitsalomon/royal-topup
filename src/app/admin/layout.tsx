'use client'

import Sidebar from '@/components/admin/Sidebar'
import PendingNotifier from '@/components/admin/PendingNotifier'
import LoginNotifier from '@/components/admin/LoginNotifier'
import AdminHeader from '@/components/admin/AdminHeader'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Check if the current route is the login page
    const isLoginPage = pathname === '/admin/login'

    useEffect(() => {
        const checkAuth = () => {
            if (isLoginPage) {
                setIsLoading(false)
                return
            }

            const storedUser = localStorage.getItem('user')
            if (!storedUser) {
                router.push('/admin/login')
                return
            }

            try {
                const user = JSON.parse(storedUser)
                const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'STAFF']
                if (!allowedRoles.includes(user.role)) {
                    // Not an admin!
                    localStorage.removeItem('user')
                    router.push('/admin/login')
                    return
                }
                // All good
                setIsLoading(false)
            } catch (e) {
                localStorage.removeItem('user')
                router.push('/admin/login')
            }
        }

        checkAuth()
    }, [pathname, isLoginPage, router])

    if (isLoading && !isLoginPage) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#000000]">
            {/* Simple Background */}
            <div className="fixed inset-0 bg-[#000000]" />

            {!isLoginPage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
            {!isLoginPage && <PendingNotifier />}
            {!isLoginPage && <LoginNotifier />}

            <main className="flex-1 overflow-y-auto relative z-10 flex flex-col">
                {/* Header (contains Mobile Toggle & Bell) */}
                {!isLoginPage && <AdminHeader onMenuClick={() => setSidebarOpen(true)} />}

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
