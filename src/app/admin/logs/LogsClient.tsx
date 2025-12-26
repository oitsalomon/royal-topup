'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { FileText, Clock, User, ChevronLeft, ChevronRight, Search } from 'lucide-react'

// Types
interface Log {
    id: number
    user_id: number
    action: string
    details: string | null
    ip_address: string | null
    createdAt: string
    user: { username: string }
}

interface Staff {
    id: number
    username: string
}

interface Pagination {
    total: number
    page: number
    limit: number
    totalPages: number
}

interface LogsClientProps {
    initialLogs: Log[]
    initialPagination: Pagination
    staffList: Staff[]
}

export default function LogsClient({ initialLogs, initialPagination, staffList }: LogsClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // State for local input values (debounced search etc)
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

    // Extract current filters from URL
    const currentPage = Number(searchParams.get('page')) || 1
    const filterUser = searchParams.get('user_id') || 'all'
    const filterAction = searchParams.get('action') || 'all'
    const filterDate = searchParams.get('date') || ''

    // Helper to update URL params
    const updateParams = (updates: Record<string, string | number | null>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'all') {
                params.delete(key)
            } else {
                params.set(key, String(value))
            }
        })

        router.push(`${pathname}?${params.toString()}`)
    }

    const handleSearch = () => {
        updateParams({ search: searchTerm, page: 1 })
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Log Aktivitas</h1>
                    <p className="text-gray-400 mt-1">Rekam jejak aktivitas sistem internal</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/5 p-4 rounded-2xl mb-6 border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cari detail..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 pl-10 text-white text-sm outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                </div>

                <select
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                    value={filterUser}
                    onChange={e => updateParams({ user_id: e.target.value, page: 1 })}
                >
                    <option value="all">Semua Admin</option>
                    {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.username}</option>
                    ))}
                </select>

                <select
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                    value={filterAction}
                    onChange={e => updateParams({ action: e.target.value, page: 1 })}
                >
                    <option value="all">Semua Aksi</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                    <option value="APPROVE_TX">Approve Transaksi</option>
                    <option value="UPDATE_TX">Update Transaksi</option>
                    <option value="ADJUSTMENT">Adjustment Saldo</option>
                    <option value="TRANSFER">Transfer Antar Akun</option>
                </select>

                <input
                    type="date"
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                    value={filterDate}
                    onChange={e => updateParams({ date: e.target.value, page: 1 })}
                />
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-sm font-medium text-gray-400">Waktu</th>
                                <th className="p-4 text-sm font-medium text-gray-400">User</th>
                                <th className="p-4 text-sm font-medium text-gray-400">Action</th>
                                <th className="p-4 text-sm font-medium text-gray-400">Details</th>
                                <th className="p-4 text-sm font-medium text-gray-400">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {initialLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-sm text-white font-medium">
                                        {log.user?.username || `User #${log.user_id}`}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold 
                      ${log.action === 'APPROVE_TX' ? 'bg-green-500/10 text-green-400' :
                                                log.action === 'ADJUSTMENT' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    log.action.includes('UPDATE') ? 'bg-purple-500/10 text-purple-400' :
                                                        log.action === 'LOGIN' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300">
                                        {log.details}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 font-mono">
                                        {log.ip_address}
                                    </td>
                                </tr>
                            ))}
                            {initialLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Belum ada aktivitas tercatat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {initialPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center p-4 border-t border-white/5 gap-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => updateParams({ page: currentPage - 1 })}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-gray-400 text-sm">Page {currentPage} of {initialPagination.totalPages}</span>
                        <button
                            disabled={currentPage === initialPagination.totalPages}
                            onClick={() => updateParams({ page: currentPage + 1 })}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
