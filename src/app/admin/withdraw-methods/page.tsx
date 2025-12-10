
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Power } from 'lucide-react'

interface WithdrawMethod {
    id: number
    name: string
    type: string
    isActive: boolean
}

export default function WithdrawMethodsPage() {
    const [methods, setMethods] = useState<WithdrawMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [type, setType] = useState('BANK')

    const fetchMethods = async () => {
        try {
            const res = await fetch('/api/internal/withdraw-methods')
            const data = await res.json()
            if (Array.isArray(data)) setMethods(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMethods()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : {}
            const adminId = user.id || '1'

            const res = await fetch('/api/internal/withdraw-methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': String(adminId)
                },
                body: JSON.stringify({ name: name.toUpperCase(), type })
            })

            if (res.ok) {
                setName('')
                fetchMethods()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleToggle = async (id: number, current: boolean) => {
        try {
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : {}
            const adminId = user.id || '1'

            await fetch('/api/internal/withdraw-methods', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': String(adminId)
                },
                body: JSON.stringify({ id, isActive: !current })
            })
            fetchMethods()
        } catch (error) { console.error(error) }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus metode ini?')) return
        try {
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : {}
            const adminId = user.id || '1'

            await fetch(`/api/internal/withdraw-methods?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': String(adminId)
                }
            })
            fetchMethods()
        } catch (error) { console.error(error) }
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-2">Metode Withdraw</h1>
            <p className="text-gray-400 mb-8">Atur daftar Bank/E-Wallet tujuan yang tersedia untuk customer.</p>

            <div className="glass p-6 rounded-2xl mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Tambah Metode Baru</h3>
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Nama Bank/E-Wallet (Contoh: DANA)"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <select
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="BANK">Bank Transfer</option>
                        <option value="EWALLET">E-Wallet</option>
                    </select>
                    <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 rounded-xl font-bold flex items-center gap-2">
                        <Plus size={20} /> Tambah
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {methods.map(m => (
                    <div key={m.id} className={`glass p-4 rounded-xl flex items-center justify-between border ${m.isActive ? 'border-green-500/30' : 'border-red-500/30'}`}>
                        <div>
                            <h4 className="font-bold text-white">{m.name}</h4>
                            <span className="text-xs text-gray-400">{m.type}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleToggle(m.id, m.isActive)}
                                className={`p-2 rounded-lg ${m.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                            >
                                <Power size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(m.id)}
                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-400"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
