'use client'

import { useState, useEffect } from 'react'
import { FileText, Clock, User } from 'lucide-react'

interface Log {
    id: number
    user_id: number
    action: string
    details: string
    ip_address: string
    createdAt: string
    user: {
        username: string
    }
}

export default function AdminLogs() {
    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/internal/activity-logs')
            const data = await res.json()
            setLogs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Log Aktivitas</h1>
                    <p className="text-gray-400 mt-1">Rekam jejak aktivitas sistem internal</p>
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
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
                            {logs.map((log) => (
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
                                                    'bg-blue-500/10 text-blue-400'}`}>
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
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Belum ada aktivitas tercatat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
