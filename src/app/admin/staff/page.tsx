'use client'

import { useState, useEffect } from 'react'
import { Plus, User, Shield } from 'lucide-react'

interface Staff {
    id: number
    username: string
    role: string
    balance_money: number
    balance_chip: number
    isActive: boolean
    permissions: string
    lastLogin: string | null
    stats: {
        topup_money: number
        topup_chip: number
        withdraw_count: number
        withdraw_chip: number
    }
}

const AVAILABLE_PERMISSIONS = [
    { id: 'MANAGE_TRANSACTIONS', label: 'Kelola Transaksi' },
    { id: 'MANAGE_STAFF', label: 'Kelola Staff' },
    { id: 'MANAGE_SETTINGS', label: 'Kelola Pengaturan' },
    { id: 'VIEW_LOGS', label: 'Lihat Log' },
]

export default function AdminStaff() {
    const [staff, setStaff] = useState<Staff[]>([])
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'CS',
        permissions: [] as string[]
    })

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/internal/staff')
            const data = await res.json()
            if (Array.isArray(data)) {
                setStaff(data)
            } else {
                console.error('API returned non-array:', data)
                setStaff([])
            }
        } catch (error) {
            console.error('Fetch error:', error)
            setStaff([])
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/internal/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    permissions: formData.permissions.join(',')
                })
            })
            if (res.ok) {
                setShowForm(false)
                fetchStaff()
                setFormData({ username: '', password: '', role: 'CS', permissions: [] })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const [showEditModal, setShowEditModal] = useState(false)
    const [editData, setEditData] = useState({
        id: 0,
        username: '',
        password: '',
        role: '',
        isActive: true,
        permissions: [] as string[]
    })

    const handleEdit = (s: Staff) => {
        setEditData({
            id: s.id,
            username: s.username,
            password: '', // Leave empty to keep unchanged
            role: s.role,
            isActive: s.isActive,
            permissions: s.permissions ? s.permissions.split(',') : []
        })
        setShowEditModal(true)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/internal/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editData.id,
                    role: editData.role,
                    password: editData.password || undefined,
                    isActive: editData.isActive,
                    permissions: editData.permissions.join(',')
                })
            })
            if (res.ok) {
                setShowEditModal(false)
                fetchStaff()
                alert('Staff updated successfully')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to update staff')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus staff ini?')) return
        try {
            const res = await fetch(`/api/internal/staff?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchStaff()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleResetStats = async (id: number) => {
        if (!confirm('Yakin ingin mereset statistik staff ini menjadi 0?')) return
        try {
            const res = await fetch('/api/internal/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    action: 'RESET_STATS'
                })
            })
            if (res.ok) {
                fetchStaff()
                alert('Statistik berhasil direset')
            }
        } catch (error) {
            console.error(error)
            alert('Gagal mereset statistik')
        }
    }

    const togglePermission = (permId: string, isEdit: boolean) => {
        if (isEdit) {
            setEditData(prev => {
                const perms = prev.permissions.includes(permId)
                    ? prev.permissions.filter(p => p !== permId)
                    : [...prev.permissions, permId]
                return { ...prev, permissions: perms }
            })
        } else {
            setFormData(prev => {
                const perms = prev.permissions.includes(permId)
                    ? prev.permissions.filter(p => p !== permId)
                    : [...prev.permissions, permId]
                return { ...prev, permissions: perms }
            })
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Staff Management</h1>
                    <p className="text-gray-400 mt-1">Kelola akses dan peran staff</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Tambah Staff
                </button>
            </div>

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">Tambah Staff Baru</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text" placeholder="Username"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required
                        />
                        <input
                            type="password" placeholder="Password"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required
                        />
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="ADMIN">Admin Utama</option>
                            <option value="CS">Customer Service</option>
                            <option value="VIEWER">Viewer (Laporan Only)</option>
                        </select>
                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-400 mb-2 block">Hak Akses</label>
                            <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_PERMISSIONS.map(p => (
                                    <label key={p.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.includes(p.id)}
                                            onChange={() => togglePermission(p.id, false)}
                                            className="rounded bg-black/40 border-white/10"
                                        />
                                        {p.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-pink-500 text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">Edit Akses Staff</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                                    value={editData.username}
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Password Baru (Opsional)</label>
                                <input
                                    type="password"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    placeholder="Kosongkan jika tidak ingin mengubah"
                                    value={editData.password}
                                    onChange={e => setEditData({ ...editData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Role</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    value={editData.role}
                                    onChange={e => setEditData({ ...editData, role: e.target.value })}
                                >
                                    <option value="ADMIN">Admin Utama</option>
                                    <option value="CS">Customer Service</option>
                                    <option value="VIEWER">Viewer (Laporan Only)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Status Akun</label>
                                <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/10">
                                    <span className={`text-sm font-bold ${editData.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                        {editData.isActive ? 'AKTIF' : 'NONAKTIF'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                                        className={`ml-auto px-3 py-1 rounded-lg text-xs font-bold transition-colors ${editData.isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                                    >
                                        {editData.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Hak Akses</label>
                                <div className="grid grid-cols-1 gap-2 bg-black/40 p-3 rounded-xl border border-white/10">
                                    {AVAILABLE_PERMISSIONS.map(p => (
                                        <label key={p.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editData.permissions.includes(p.id)}
                                                onChange={() => togglePermission(p.id, true)}
                                                className="rounded bg-black/40 border-white/10"
                                            />
                                            {p.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10">Batal</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((s) => (
                    <div key={s.id} className={`glass p-6 rounded-2xl relative overflow-hidden group ${!s.isActive ? 'opacity-75' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.isActive ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-700 text-gray-500'}`}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{s.username}</h3>
                                    <p className="text-xs text-gray-400">{s.role}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-500 mb-1">Total Top Up (Masuk)</p>
                                <div className="flex justify-between items-end">
                                    <span className="text-green-400 font-bold text-sm">Rp {s.stats?.topup_money.toLocaleString() || 0}</span>
                                    <span className="text-yellow-400 font-bold text-xs">{Number(s.stats?.topup_chip || 0).toFixed(2)} B</span>
                                </div>
                            </div>

                            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-500 mb-1">Total Withdraw (Keluar)</p>
                                <div className="flex justify-between items-end">
                                    <span className="text-white font-bold text-sm">{s.stats?.withdraw_count || 0} Trx</span>
                                    <span className="text-red-400 font-bold text-xs">{Number(s.stats?.withdraw_chip || 0).toFixed(2)} B</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-sm pt-2 border-t border-white/5 mt-2">
                                <span className="text-gray-500">Terakhir Login</span>
                                <span className="text-white text-xs">
                                    {s.lastLogin ? new Date(s.lastLogin).toLocaleString() : '-'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                            <button
                                onClick={() => handleEdit(s)}
                                className="flex-1 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Edit Akses
                            </button>
                            <button
                                onClick={() => handleResetStats(s.id)}
                                className="flex-1 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-yellow-400 hover:text-yellow-300"
                            >
                                Reset Stats
                            </button>
                            <button
                                onClick={() => handleDelete(s.id)}
                                className="flex-1 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
