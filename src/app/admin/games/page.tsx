'use client'

import { useState, useEffect } from 'react'
import { Plus, Gamepad2, Link as LinkIcon, Trash2, Edit } from 'lucide-react'

interface Game {
    id: number
    name: string
    code: string
    image: string | null
    category: string
    isActive: boolean
    externalUrl: string | null
}

export default function AdminGames() {
    const [games, setGames] = useState<Game[]>([])
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        id: 0,
        name: '',
        code: '',
        image: '',
        category: 'GAMES',
        isActive: true,
        externalUrl: ''
    })
    const [isEditing, setIsEditing] = useState(false)
    const [uploading, setUploading] = useState(false)

    const fetchGames = async () => {
        const res = await fetch('/api/games')
        const data = await res.json()
        if (Array.isArray(data)) {
            setGames(data)
        } else {
            console.error('Games data is not an array:', data)
            setGames([])
        }
    }

    useEffect(() => {
        fetchGames()
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
            const url = '/api/games'
            const method = isEditing ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowForm(false)
                fetchGames()
                resetForm()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus game ini?')) return
        try {
            await fetch(`/api/games?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            fetchGames()
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = (game: Game) => {
        setFormData({
            id: game.id,
            name: game.name,
            code: game.code,
            image: game.image || '',
            category: game.category,
            isActive: game.isActive,
            externalUrl: game.externalUrl || ''
        })
        setIsEditing(true)
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            id: 0,
            name: '',
            code: '',
            image: '',
            category: 'GAMES',
            isActive: true,
            externalUrl: ''
        })
        setIsEditing(false)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Manajemen Game</h1>
                    <p className="text-gray-400 mt-1">Atur daftar game dan link eksternal</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Tambah Game
                </button>
            </div>

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">{isEditing ? 'Edit Game' : 'Tambah Game Baru'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text" placeholder="Nama Game"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                        />
                        <input
                            type="text" placeholder="Kode Unik (e.g. MLBB)"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required
                        />
                        <label className="block text-xs text-gray-400 mb-1">Gambar Game</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24 bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group/preview">
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                                ) : formData.image ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, image: '' })}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-red-500"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <Gamepad2 className="text-gray-600" size={32} />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return

                                        setUploading(true)
                                        const uploadData = new FormData()
                                        uploadData.append('file', file)

                                        try {
                                            const res = await fetch('/api/upload', {
                                                method: 'POST',
                                                body: uploadData
                                            })
                                            const data = await res.json()
                                            if (data.url) {
                                                setFormData({ ...formData, image: data.url })
                                            } else {
                                                alert('Gagal upload: ' + (data.error || 'Unknown error'))
                                            }
                                        } catch (err) {
                                            console.error('Upload error:', err)
                                            alert('Terjadi kesalahan saat upload gambar')
                                        } finally {
                                            setUploading(false)
                                        }
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-2">Upload gambar (JPG/PNG). Otomatis masuk Cloud Storage.</p>
                            </div>
                        </div>
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                            value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="GAMES">Games</option>
                            <option value="APPS">Apps</option>
                            <option value="OTHERS">Lainnya</option>
                        </select>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Link Eksternal (Optional)</label>
                            <input
                                type="text" placeholder="https://..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                                value={formData.externalUrl} onChange={e => setFormData({ ...formData, externalUrl: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Jika diisi, user akan diarahkan ke link ini saat klik game.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300"
                            />
                            <label htmlFor="isActive" className="text-white">Tampilkan di Home</label>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-cyan-500 text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </form>
                </div >
            )
            }

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {games.map((game) => (
                    <div key={game.id} className={`glass p-4 rounded-2xl relative group ${!game.isActive ? 'opacity-50' : ''}`}>
                        <div className="aspect-video bg-black/40 rounded-xl mb-4 overflow-hidden relative">
                            {game.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    <Gamepad2 size={32} />
                                </div>
                            )}
                            {game.externalUrl && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-lg shadow-lg">
                                    <LinkIcon size={14} />
                                </div>
                            )}
                        </div>

                        <h3 className="font-bold text-white truncate">{game.name}</h3>
                        <p className="text-xs text-gray-400 mb-2">{game.category}</p>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => handleEdit(game)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-cyan-400 flex items-center justify-center"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(game.id)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-red-400 flex items-center justify-center"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    )
}
