'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports — komponen berat hanya di-load setelah auth berhasil
// Ini mencegah Sidebar, Notifiers, dll ter-bundle di halaman login
const Sidebar = dynamic(() => import('@/components/admin/Sidebar'), {
    loading: () => null,
    ssr: false,
})
const PendingNotifier = dynamic(() => import('@/components/admin/PendingNotifier'), {
    loading: () => null,
    ssr: false,
})
const LoginNotifier = dynamic(() => import('@/components/admin/LoginNotifier'), {
    loading: () => null,
    ssr: false,
})
const AdminHeader = dynamic(() => import('@/components/admin/AdminHeader'), {
    loading: () => null,
    ssr: false,
})

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
                    localStorage.removeItem('user')
                    router.push('/admin/login')
                    return
                }
                setIsLoading(false)
            } catch (e) {
                localStorage.removeItem('user')
                router.push('/admin/login')
            }
        }

        checkAuth()
    }, [pathname, isLoginPage, router])

    // Login page — render langsung tanpa loading state
    if (isLoginPage) {
        return <>{children}</>
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#000000]">
            {/* Simple Background */}
            <div className="fixed inset-0 bg-[#000000]" />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <PendingNotifier />
            <LoginNotifier />

            <main className="flex-1 overflow-y-auto relative z-10 flex flex-col">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
