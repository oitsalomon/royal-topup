'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, Edit, Trash2 } from 'lucide-react'

interface Package {
    id: number
    name: string
    chip: number
    price: number
    isActive: boolean
}

export default function AdminPackages() {
    const [packages, setPackages] = useState<Package[]>([])
    const [showForm, setShowForm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(0)

    const [formData, setFormData] = useState({
        name: '',
        chip: '',
        price: ''
    })

    const fetchPackages = async () => {
        const res = await fetch('/api/packages')
        const data = await res.json()
        if (Array.isArray(data)) {
            setPackages(data)
        } else {
            console.error('Packages data is not an array:', data)
            setPackages([])
        }
    }

    useEffect(() => {
        fetchPackages()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = '/api/packages'
            const method = isEditing ? 'PUT' : 'POST'
            const body = isEditing ? { ...formData, id: editId } : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setShowForm(false)
                fetchPackages()
                resetForm()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = (pkg: Package) => {
        setFormData({
            name: pkg.name,
            chip: pkg.chip.toString(),
            price: pkg.price.toString()
        })
        setEditId(pkg.id)
        setIsEditing(true)
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus paket ini?')) return
        try {
            await fetch(`/api/packages?id=${id}`, { method: 'DELETE' })
            fetchPackages()
        } catch (error) {
            console.error(error)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            chip: '',
            price: ''
        })
        setIsEditing(false)
        setEditId(0)
    }

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/packages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            if (res.ok) {
                fetchPackages()
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Manajemen Paket</h1>
                    <p className="text-gray-400 mt-1">Atur daftar paket Top Up yang tersedia</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Tambah Paket
                </button>
            </div>

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">{isEditing ? 'Edit Paket' : 'Tambah Paket Baru'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text" placeholder="Nama Label (e.g. 120 M)"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                        />
                        <input
                            type="number" placeholder="Jumlah Chip (e.g. 120)"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.chip} onChange={e => setFormData({ ...formData, chip: e.target.value })} required
                        />
                        <input
                            type="number" placeholder="Harga (Rp)"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required
                        />
                        <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg) => (
                    <div key={pkg.id} className={`glass p-6 rounded-2xl relative group ${!pkg.isActive ? 'opacity-50' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <Package size={24} />
                            </div>
                            <button
                                onClick={() => handleToggleStatus(pkg.id, pkg.isActive)}
                                className={`px-2 py-1 rounded text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity ${pkg.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                            >
                                {pkg.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                        </div>

                        <div className="space-y-1 mb-4">
                            <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
                            <p className="text-sm text-gray-400">{pkg.chip} Chip</p>
                            <p className="text-lg font-bold text-blue-400">Rp {pkg.price.toLocaleString()}</p>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                            <button
                                onClick={() => handleEdit(pkg)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-cyan-400 flex items-center justify-center"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(pkg.id)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-red-400 flex items-center justify-center"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
