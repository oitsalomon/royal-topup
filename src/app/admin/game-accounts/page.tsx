'use client'

import { useState, useEffect } from 'react'
import { Plus, Coins, Gamepad2 } from 'lucide-react'

interface GameAccount {
    id: number
    game_id: number
    username: string
    role: string
    balance: number
    isActive: boolean
    game: {
        name: string
        code: string
    }
}

export default function AdminGameAccounts() {
    const [accounts, setAccounts] = useState<GameAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(0)

    const [formData, setFormData] = useState({
        game_id: '1', // Mock default
        username: '',
        password: '',
        role: 'ALL',
        balance: ''
    })

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/internal/game-accounts')
            const data = await res.json()
            if (Array.isArray(data)) {
                setAccounts(data)
            } else {
                console.error('Game Accounts data is not an array:', data)
                setAccounts([])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAccounts()
    }, [])

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' }
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) headers['X-User-Id'] = String(user.id)
            }
        } catch (e) { }
        return headers
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = '/api/internal/game-accounts'
            const method = isEditing ? 'PUT' : 'POST'
            const body = isEditing ? { ...formData, id: editId } : formData

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            })
            if (res.ok) {
                setShowForm(false)
                fetchAccounts()
                resetForm()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = (acc: GameAccount) => {
        setFormData({
            game_id: acc.game_id.toString(),
            username: acc.username,
            password: '',
            role: acc.role,
            balance: acc.balance.toString()
        })
        setEditId(acc.id)
        setIsEditing(true)
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            game_id: '1',
            username: '',
            password: '',
            role: 'ALL',
            balance: ''
        })
        setIsEditing(false)
        setEditId(0)
    }

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        if (!confirm(`Ubah status akun ini menjadi ${!currentStatus ? 'ACTIVE' : 'INACTIVE'}?`)) return
        try {
            const res = await fetch('/api/internal/game-accounts', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            if (res.ok) {
                fetchAccounts()
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Panel ID Game</h1>
                    <p className="text-gray-400 mt-1">Kelola akun game dan stok chip internal</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Tambah ID
                </button>
            </div>

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">{isEditing ? 'Edit ID Game' : 'Tambah ID Game Baru'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.game_id} onChange={e => setFormData({ ...formData, game_id: e.target.value })}
                        >
                            <option value="1">Royal Dream (Mock)</option>
                            {/* Fetch games dynamically later */}
                        </select>
                        <input
                            type="text" placeholder="Username / ID"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required
                        />
                        <input
                            type="text" placeholder="Password (Optional)"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="ALL">All Role (TopUp & WD)</option>
                            <option value="DEPOSIT">Khusus Top Up (Kirim Chip)</option>
                            <option value="WITHDRAW">Khusus WD (Terima Chip)</option>
                            <option value="GUDANG">Gudang (Penyimpanan)</option>
                        </select>
                        <input
                            type="number" placeholder="Stok Awal Chip"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        />
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-purple-500 text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc) => (
                    <div key={acc.id} className="glass p-6 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                                    <Gamepad2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{acc.username}</h3>
                                    <p className="text-xs text-gray-400">{acc.game?.name || 'Unknown Game'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleStatus(acc.id, acc.isActive)}
                                className={`px-2 py-1 rounded text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity ${acc.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                            >
                                {acc.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                        </div>

                        <div className="space-y-1 mb-4">
                            <p className="text-xs text-gray-500">ID Game</p>
                            <p className="text-xl font-bold text-white tracking-tight font-mono">{acc.username}</p>

                            <div className="mt-4">
                                <p className="text-xs text-gray-500">Stok Chip</p>
                                <p className="text-2xl font-bold text-yellow-400">{acc.balance.toLocaleString()} B</p>
                            </div>

                            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider font-bold">{acc.role}</p>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                            <button className="flex-1 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                Mutasi
                            </button>
                            <button
                                onClick={() => handleEdit(acc)}
                                className="flex-1 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
