'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, RefreshCw, Trash2, Key, Edit2, X, Check } from 'lucide-react'
import Link from 'next/link'
import AlertModal from '@/components/AlertModal'
import { formatChip } from '@/lib/utils'

export default function MemberDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [member, setMember] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ open: boolean, type: 'success' | 'error', title: string, message: string }>({
        open: false, type: 'success', title: '', message: ''
    })

    // Forms State
    const [bankForm, setBankForm] = useState({
        bank_name: '',
        account_number: '',
        account_name: ''
    })
    const [password, setPassword] = useState('')

    // New Feature States
    const [games, setGames] = useState<any[]>([])
    const [newGameForm, setNewGameForm] = useState({ gameId: 0, gameUserId: '' })

    useEffect(() => {
        fetchMember()
        fetchGames()
    }, [])

    const fetchGames = async () => {
        try {
            const res = await fetch('/api/games')
            const data = await res.json()
            if (data) setGames(data)
        } catch (e) {
            console.error(e)
        }
    }

    const fetchMember = async () => {
        try {
            const res = await fetch(`/api/internal/members/${params.id}`)
            const data = await res.json()
            if (data.id) {
                setMember(data)
                setBankForm({
                    bank_name: data.bank_name || '',
                    account_number: data.account_number || '',
                    account_name: data.account_name || ''
                })
            } else {
                router.push('/admin/members')
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateBank = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/internal/members/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify(bankForm)
            })
            if (res.ok) {
                setAlert({ open: true, type: 'success', title: 'Berhasil', message: 'Data bank berhasil diupdate.' })
                fetchMember()
            } else {
                throw new Error()
            }
        } catch (error) {
            setAlert({ open: true, type: 'error', title: 'Gagal', message: 'Gagal update bank.' })
        }
    }

    const handleResetCashback = async () => {
        if (!confirm('Yakin reset cashback minggu ini ke 0?')) return
        try {
            const res = await fetch(`/api/internal/members/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'reset_cashback' })
            })
            if (res.ok) {
                setAlert({ open: true, type: 'success', title: 'Berhasil', message: 'Cashback di-reset.' })
                fetchMember()
            }
        } catch (error) {
            setAlert({ open: true, type: 'error', title: 'Gagal', message: 'Gagal reset cashback.' })
        }
    }

    const handlePasswordChange = async () => {
        if (!password) return
        if (!confirm('Ganti password user ini?')) return
        try {
            const res = await fetch(`/api/internal/members/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ password })
            })
            if (res.ok) {
                setAlert({ open: true, type: 'success', title: 'Berhasil', message: 'Password diganti.' })
                setPassword('')
            }
        } catch (error) {
            setAlert({ open: true, type: 'error', title: 'Gagal', message: 'Gagal ganti password.' })
        }
    }

    const [editGameId, setEditGameId] = useState<{ id: number, val: string, gameId: number } | null>(null)

    const handleUpdateGameId = async () => {
        if (!editGameId) return
        try {
            const res = await fetch(`/api/internal/members/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'update_game_id',
                    rowId: editGameId.id,
                    newGameUserId: editGameId.val,
                    newGameId: editGameId.gameId
                })
            })
            if (res.ok) {
                setAlert({ open: true, type: 'success', title: 'Berhasil', message: 'Game ID diupdate.' })
                setEditGameId(null)
                fetchMember()
            } else {
                throw new Error()
            }
        } catch (error) {
            setAlert({ open: true, type: 'error', title: 'Gagal', message: 'Gagal update Game ID.' })
        }
    }

    const handleDeleteGameId = async (rowId: number) => {
        if (!confirm('Hapus Game ID ini dari user?')) return
        try {
            const res = await fetch(`/api/internal/members/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'delete_game_id',
                    rowId
                })
            })
            if (res.ok) {
                setAlert({ open: true, type: 'success', title: 'Berhasil', message: 'Game ID dihapus.' })
                fetchMember()
            }
        } catch (error) {
            setAlert({ open: true, type: 'error', title: 'Gagal', message: 'Gagal hapus Game ID.' })
        }
    }

    const handleAddGameId = async () => {
        if (!newGameForm.gameId || !newGameForm.gameUserId) return
        try {
            const res = await fetch(`/api/internal/members/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'add_game_id',
                    gameId: newGameForm.gameId,
                    gameUserId: newGameForm.gameUserId
                })
            })
            if (res.ok) {
                setAlert({ open: true, type: 'success', title: 'Berhasil', message: 'Game ID ditambahkan.' })
                setNewGameForm({ gameId: 0, gameUserId: '' })
                fetchMember()
            } else {
                throw new Error()
            }
        } catch (error) {
            setAlert({ open: true, type: 'error', title: 'Gagal', message: 'Gagal tambah Game ID.' })
        }
    }

    const handleLevelChange = async (newLevel: string) => {
        if (!confirm(`Ubah level user ke ${newLevel}?`)) return
        try {
            const res = await fetch(`/api/internal/members/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    level: newLevel
                })
            })
            if (res.ok) {
                setAlert({ open: true, type: 'success', title: 'Berhasil', message: 'Level diupdate.' })
                fetchMember()
            }
        } catch (error) {
            setAlert({ open: true, type: 'error', title: 'Gagal', message: 'Gagal update Level.' })
        }
    }

    if (loading) return <div className="text-white p-8">Loading...</div>
    if (!member) return null

    return (
        <div className="space-y-8 pb-10">
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert(prev => ({ ...prev, open: false }))}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />

            <div className="flex items-center gap-4">
                <Link href="/admin/members" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">{member.username}</h1>
                    <div className="flex items-center gap-2">
                        <select
                            value={member.level}
                            onChange={(e) => handleLevelChange(e.target.value)}
                            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5 text-xs font-bold focus:outline-none focus:bg-emerald-500/30 cursor-pointer"
                        >
                            <option value="BRONZE" className="bg-slate-900">BRONZE</option>
                            <option value="SILVER" className="bg-slate-900">SILVER</option>
                            <option value="GOLD" className="bg-slate-900">GOLD</option>
                            <option value="DIAMOND" className="bg-slate-900">DIAMOND</option>
                        </select>
                        <span className="text-gray-400 text-sm">Joined {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Stats Card */}
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/5">
                        <h3 className="font-bold text-gray-300 mb-6 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-yellow-400" /> Stats Minggu Ini
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                                <span className="text-gray-400">Total Turnover</span>
                                <span className="text-xl font-bold text-white">
                                    {formatChip(member.weeklyStats[0]?.total_turnover || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                                <span className="text-gray-400">Cashback Earned</span>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-emerald-400">
                                        {formatChip(member.weeklyStats[0]?.cashback_earned || 0)}
                                    </span>
                                    {member.weeklyStats[0]?.cashback_earned > 0 && (
                                        <button
                                            onClick={handleResetCashback}
                                            className="text-xs text-red-400 hover:text-red-300 underline mt-1"
                                        >
                                            Hapus Cashback
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linked Games */}
                    <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-300">Game Accounts Linked</h3>
                        </div>

                        <div className="space-y-3">
                            {member.gameIds.map((g: any) => (
                                <div key={g.id} className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-black/20 group">
                                    <span className="text-gray-400 text-sm">{g.game.name}</span>

                                    {editGameId?.id === g.id ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="bg-black border border-white/20 rounded px-2 py-1 text-xs text-white"
                                                value={editGameId?.gameId || 0}
                                                onChange={(e) => editGameId && setEditGameId({ ...editGameId, gameId: Number(e.target.value) })}
                                            >
                                                {games.map((game) => (
                                                    <option key={game.id} value={game.id}>{game.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                className="bg-black border border-white/20 rounded px-2 py-1 text-xs text-white w-24"
                                                value={editGameId?.val || ''}
                                                onChange={e => setEditGameId(prev => (prev ? { ...prev, val: e.target.value } : null))}
                                            />
                                            <button onClick={handleUpdateGameId} className="text-green-400 hover:text-green-300"><Check size={16} /></button>
                                            <button onClick={() => setEditGameId(null)} className="text-red-400 hover:text-red-300"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-white">{g.game_user_id}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditGameId({ id: g.id, val: g.game_user_id, gameId: g.game_id })}
                                                    className="p-1 hover:bg-white/10 rounded text-cyan-400"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGameId(g.id)}
                                                    className="p-1 hover:bg-red-500/20 rounded text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {member.gameIds.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No games linked.</p>}
                        </div>

                        {/* Add New Game ID Form */}
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Tambah Game ID Manual</p>
                            <div className="flex gap-2">
                                <select
                                    className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                    value={newGameForm.gameId}
                                    onChange={e => setNewGameForm({ ...newGameForm, gameId: Number(e.target.value) })}
                                >
                                    <option value={0}>Pilih Game...</option>
                                    {games.map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                <input
                                    placeholder="ID User Game"
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                    value={newGameForm.gameUserId}
                                    onChange={e => setNewGameForm({ ...newGameForm, gameUserId: e.target.value })}
                                />
                                <button
                                    onClick={handleAddGameId}
                                    disabled={!newGameForm.gameId || !newGameForm.gameUserId}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-lg disabled:opacity-50"
                                >
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Forms */}
                <div className="space-y-6">
                    {/* Bank Form */}
                    <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/5">
                        <h3 className="font-bold text-gray-300 mb-6 flex items-center gap-2">
                            <Save size={18} className="text-blue-400" /> Edit Data Bank
                        </h3>
                        <form onSubmit={handleUpdateBank} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Bank</label>
                                <input
                                    type="text"
                                    value={bankForm.bank_name}
                                    onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nomor Rekening</label>
                                <input
                                    type="text"
                                    value={bankForm.account_number}
                                    onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Atas Nama</label>
                                <input
                                    type="text"
                                    value={bankForm.account_name}
                                    onChange={e => setBankForm({ ...bankForm, account_name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                />
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors">
                                Simpan Perubahan Bank
                            </button>
                        </form>
                    </div>

                    {/* Security */}
                    <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/5">
                        <h3 className="font-bold text-gray-300 mb-6 flex items-center gap-2">
                            <Key size={18} className="text-red-400" /> Security & Account
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ganti Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="Password Baru"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                    />
                                    <button
                                        onClick={handlePasswordChange}
                                        className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs"
                                    >
                                        Ubah
                                    </button>
                                </div>
                            </div>

                            <hr className="border-white/5 my-4" />

                            <button className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                <Trash2 size={16} /> Nonaktifkan Member (Ban)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
