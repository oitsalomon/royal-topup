'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Trophy, RefreshCcw } from 'lucide-react'

export default function LotteryManager() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [winners, setWinners] = useState<any[]>([])
    const [stats, setStats] = useState({ totalTickets: 0, totalParticipants: 0, topPlayers: [] })
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [lastTicketId, setLastTicketId] = useState<number | null>(null)
    const [toast, setToast] = useState<{ visible: boolean, message: string }>({ visible: false, message: '' })

    // Default to current Bi-Weekly Period
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()

    // Period Format: YYYY-MM-H1 (1-15) or YYYY-MM-H2 (16-End)
    const isFirstHalf = currentDay <= 15
    const defaultPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${isFirstHalf ? 'H1' : 'H2'}`

    const [period, setPeriod] = useState(defaultPeriod)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch stats for period
                const res = await fetch('/api/loyalty/lottery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-User-Id': '1' }, // Dummy ID for stats
                    body: JSON.stringify({ action: 'STATS', period })
                })
                const data = await res.json()
                if (res.ok) {
                    setStats(data)
                }
            } catch (error) {
                console.error("Failed to fetch lottery stats", error)
            }
        }

        const fetchRecent = async () => {
            try {
                const res = await fetch('/api/loyalty/lottery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-User-Id': '1' },
                    body: JSON.stringify({ action: 'RECENT_ACTIVITY', period })
                })
                const data = await res.json()
                if (res.ok && data.recent) {
                    setRecentActivity(data.recent)

                    // Check for new tickets
                    if (data.recent.length > 0) {
                        const latestId = data.recent[0].id
                        if (lastTicketId !== null && latestId > lastTicketId) {
                            // New Ticket!
                            const user = data.recent[0].user.username
                            setToast({ visible: true, message: `Active: ${user} just redeemed a ticket!` })
                            setTimeout(() => setToast({ visible: false, message: '' }), 4000)
                        }
                        setLastTicketId(latestId)
                    }
                }
            } catch (e) { console.error(e) }
        }

        fetchStats()
        fetchRecent()

        // Poll for recent activity every 5 seconds
        const interval = setInterval(fetchRecent, 5000)
        return () => clearInterval(interval)
    }, [period, lastTicketId]) // Dependency on lastTicketId to ensure comparison works correctly? 
    // Actually, if we include lastTicketId in deps, it will re-set interval which is fine but maybe wasteful.
    // Better to use ref for lastTicketId or functional state update, but this is simple enough.
    // Warning: infinite loop if lastTicketId updates? No, only updates if different.
    // But fetchRecent is closing over stale lastTicketId if not in deps.
    // Correct approach: Use functional setLastTicketId or refs. 
    // Simplified: Just add lastTicketId to dependency array. It only changes when a NEW ticket arrives.


    // Generate options for dropdown (Previous 5 periods + Next 2)
    const generatePeriodOptions = () => {
        const options = []
        let y = currentYear
        let m = currentMonth
        // let h = isFirstHalf ? 1 : 2

        // Let's just generate a list around the current date
        for (let i = -4; i <= 2; i++) {
            // Logic to shift months/halves
            let targetMonth = m
            let targetYear = y

            // Simplification: Just generate list of months, then H1/H2 for each
            // Adjust month by i/2 ? No, that's complex.
            // Let's iterate months.

            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            const year = d.getFullYear()
            const month = d.getMonth() + 1
            const monthStr = String(month).padStart(2, '0')

            options.push({ value: `${year}-${monthStr}-H1`, label: `${d.toLocaleString('default', { month: 'long' })} ${year} (Awal)` })
            options.push({ value: `${year}-${monthStr}-H2`, label: `${d.toLocaleString('default', { month: 'long' })} ${year} (Akhir)` })
        }
        return options.sort((a, b) => a.value.localeCompare(b.value))
    }

    const periodOptions = generatePeriodOptions()

    const handleDraw = async () => {
        if (!confirm(`Draw winners for period ${period}? This cannot be undone.`)) return

        setLoading(true)
        try {
            const res = await fetch('/api/loyalty/lottery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': JSON.parse(localStorage.getItem('user') || '{}').id
                },
                body: JSON.stringify({
                    action: 'DRAW',
                    period: period,
                    winnersCount: 10
                })
            })

            const data = await res.json()
            if (res.ok) {
                setWinners(data.winners)
                alert('Lottery Draw Complete!')
            } else {
                alert(data.error || 'Failed to draw lottery')
            }
        } catch (error) {
            console.error(error)
            alert('Error connecting to server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-[#1a2332] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Ticket className="text-emerald-400" />
                            Lottery Management
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Manage bi-weekly lottery draws</p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            {periodOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-sm text-gray-400">Total Tiket Terjual</p>
                            <p className="text-2xl font-bold text-emerald-400">{stats.totalTickets.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-sm text-gray-400">Total Partisipan</p>
                            <p className="text-2xl font-bold text-blue-400">{stats.totalParticipants.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 h-64 flex flex-col">
                        <p className="text-sm text-gray-400 mb-3">Aktivitas Terkini (Real-time)</p>
                        <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar">
                            {recentActivity.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Belum ada aktivitas</p>
                            ) : (
                                recentActivity.map((ticket: any) => (
                                    <div key={ticket.id} className="flex justify-between items-center text-xs p-2 rounded bg-black/20 border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                                                <Ticket size={12} />
                                            </div>
                                            <span className="text-white font-bold">{ticket.user.username}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-400">{new Date(ticket.createdAt).toLocaleTimeString()}</p>
                                            <p className="text-[10px] text-emerald-500/50 font-mono">{ticket.ticket_code}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 h-64 flex flex-col">
                        <p className="text-sm text-gray-400 mb-3">Top Pemegang Tiket</p>
                        <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar">
                            {stats.topPlayers.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Belum ada peserta</p>
                            ) : (
                                stats.topPlayers.map((player: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-white/5 rounded transition-colors">
                                        <span className="text-white flex items-center gap-2">
                                            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}>{idx + 1}</span>
                                            {player.username}
                                        </span>
                                        <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded text-xs">{player.count} Tiket</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* TOAST NOTIFICATION */}
                {toast.visible && (
                    <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right fade-in duration-300">
                        <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-emerald-400/50">
                            <div className="p-2 bg-white/20 rounded-full animate-bounce">
                                <Ticket size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">New Ticket Redeemed!</h4>
                                <p className="text-sm text-emerald-100">{toast.message}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-white/10 rounded-xl bg-gradient-to-b from-white/5 to-transparent">
                    <Trophy size={48} className="text-yellow-400 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Ready to Draw?</h3>
                    <p className="text-gray-400 text-center max-w-md mb-6">
                        This action will randomly select 10 winners from the pool of tickets for period <strong>{period}</strong>.
                    </p>

                    <button
                        onClick={handleDraw}
                        disabled={loading}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <RefreshCcw className="animate-spin" size={20} />
                        ) : (
                            <Ticket size={20} />
                        )}
                        {loading ? 'Drawing Winners...' : 'Draw 10 Winners'}
                    </button>
                </div>
            </div>

            {winners.length > 0 && (
                <div className="bg-[#1a2332] p-6 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={20} />
                        Winners List ({period})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {winners.map((winner, idx) => (
                            <div key={winner.id} className="bg-[#0a0f1c] p-4 rounded-xl border border-emerald-500/20 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                                    #{idx + 1}
                                </div>
                                <div>
                                    <p className="text-white font-bold">{winner.user.username}</p>
                                    <p className="text-xs text-emerald-400 font-mono">{winner.ticket_code}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
