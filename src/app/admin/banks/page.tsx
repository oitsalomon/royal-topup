'use client'

import { useState, useEffect } from 'react'
import { Plus, Wallet, CreditCard } from 'lucide-react'

interface Bank {
    id: number
    name: string
    type: string
    account_number: string
    account_name: string
    balance: number
    isActive: boolean
}

export default function AdminBanks() {
    const [banks, setBanks] = useState<Bank[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(0)

    const [formData, setFormData] = useState({
        name: '',
        type: 'BANK',
        account_number: '',
        account_name: '',
        balance: '',
        admin_id: '1'
    })

    useEffect(() => {
        // Load admin ID from session
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) {
                    setFormData(prev => ({ ...prev, admin_id: String(user.id) }))
                }
            }
        } catch (e) { console.error(e) }
    }, [])

    const fetchBanks = async () => {
        try {
            const res = await fetch('/api/internal/banks')
            const data = await res.json()
            if (Array.isArray(data)) {
                setBanks(data)
            } else {
                console.error('Banks data is not an array:', data)
                setBanks([])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBanks()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = '/api/internal/banks'
            const method = isEditing ? 'PUT' : 'POST'
            const body = isEditing ? { ...formData, id: editId } : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                setShowForm(false)
                fetchBanks()
                resetForm()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = (bank: Bank) => {
        setFormData({
            name: bank.name,
            type: bank.type,
            account_number: bank.account_number,
            account_name: bank.account_name,
            balance: bank.balance.toString(),
            admin_id: '1'
        })
        setEditId(bank.id)
        setIsEditing(true)
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'BANK',
            account_number: '',
            account_name: '',
            balance: '',
            admin_id: '1'
        })
        setIsEditing(false)
        setEditId(0)
    }

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        if (!confirm(`Ubah status bank ini menjadi ${!currentStatus ? 'AKTIF' : 'NON-AKTIF'}?`)) return

        try {
            const res = await fetch('/api/internal/banks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            if (res.ok) {
                fetchBanks()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Yakin ingin MENGHAPUS bank ${name}? Data akan hilang permanen!`)) return

        try {
            const res = await fetch(`/api/internal/banks?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchBanks()
            } else {
                alert('Gagal menghapus bank')
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan')
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Panel Bank</h1>
                    <p className="text-gray-400 mt-1">Kelola akun bank dan saldo internal</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Tambah Bank
                </button>
            </div>

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">{isEditing ? 'Edit Akun Bank' : 'Tambah Akun Bank Baru'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text" placeholder="Nama Bank (e.g. BCA)"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                        />
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="BANK">Bank Transfer</option>
                            <option value="EWALLET">E-Wallet</option>
                        </select>
                        <input
                            type="text" placeholder="Nomor Rekening"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} required
                        />
                        <input
                            type="text" placeholder="Atas Nama"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.account_name} onChange={e => setFormData({ ...formData, account_name: e.target.value })} required
                        />
                        <input
                            type="number" placeholder="Saldo Awal (Internal)"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        />
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-cyan-500 text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banks.map((bank) => (
                    <div key={bank.id} className={`glass p-6 rounded-2xl relative overflow-hidden group border ${bank.isActive ? 'border-green-500/30' : 'border-red-500/30'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bank.type === 'BANK' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {bank.type === 'BANK' ? <Wallet size={24} /> : <CreditCard size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{bank.name}</h3>
                                    <p className="text-xs text-gray-400">{bank.type}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleStatus(bank.id, bank.isActive)}
                                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity ${bank.isActive ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
                            >
                                {bank.isActive ? 'AKTIF' : 'TIDAK AKTIF'}
                            </button>
                        </div>

                        <div className="space-y-1 mb-4">
                            <p className="text-2xl font-bold text-white tracking-tight">Rp {bank.balance.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 font-mono">{bank.account_number}</p>
                            <p className="text-xs text-gray-600 uppercase">{bank.account_name}</p>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                            <button
                                onClick={() => handleDelete(bank.id, bank.name)}
                                className="flex-1 py-2 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                                Hapus
                            </button>
                            <button
                                onClick={() => handleEdit(bank)}
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
