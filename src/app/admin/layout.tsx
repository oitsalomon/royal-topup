'use client'

import Sidebar from '@/components/admin/Sidebar'
import PendingNotifier from '@/components/admin/PendingNotifier'
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

    // Check if the current route is the login page
    const isLoginPage = pathname === '/admin/login'

    useEffect(() => {
        const checkAuth = () => {
            // Allow public access to login page
            if (isLoginPage) {
                setIsLoading(false)
                return
            }

            try {
                const userStr = localStorage.getItem('user')
                if (!userStr) {
                    router.replace('/admin/login')
                    return
                }

                const user = JSON.parse(userStr)
                if (!user || !user.id || user.role !== 'ADMIN') {
                    // Extra safety: Check role if available
                    localStorage.removeItem('user')
                    router.replace('/admin/login')
                    return
                }

                // Auth OK
                setIsLoading(false)
            } catch (error) {
                console.error('Auth Check Error:', error)
                localStorage.removeItem('user')
                router.replace('/admin/login')
            }
        }

        checkAuth()
    }, [pathname, isLoginPage, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Verifying Access...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-[#0a0f1c]">
            {!isLoginPage && <Sidebar />}
            {!isLoginPage && <PendingNotifier />}
            <main className={`flex-1 overflow-y-auto relative z-10 ${!isLoginPage ? 'p-8' : ''}`}>
                {children}
            </main>
        </div>
    )
}
