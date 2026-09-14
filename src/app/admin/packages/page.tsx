'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Package, Edit, Trash2, Upload, Check, Image as ImageIcon, Pin, QrCode, X, AlertTriangle } from 'lucide-react'

interface PackageItem {
    id: number
    name: string
    chip: number
    price: number
    originalPrice?: number
    image?: string
    badge?: string
    isPinned?: boolean
    qris_image?: string
    isActive: boolean
}

export default function AdminPackages() {
    const [packages, setPackages] = useState<PackageItem[]>([])
    const [showForm, setShowForm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [qrisUploading, setQrisUploading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        chip: '',
        price: '',
        originalPrice: '',
        image: '',
        badge: '',
        isPinned: false,
        qris_image: ''
    })

    const fetchPackages = async () => {
        try {
            const res = await fetch('/api/packages')
            const data = await res.json()
            if (Array.isArray(data)) {
                setPackages(data)
            } else {
                setPackages([])
            }
        } catch {
            setPackages([])
        }
    }

    useEffect(() => {
        fetchPackages()
    }, [])

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' }
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.id) headers['X-User-Id'] = String(user.id)
            }
        } catch {}
        return headers
    }

    // Upload image to Cloudinary via /api/upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const data = new FormData()
        data.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            })
            if (res.ok) {
                const result = await res.json()
                setFormData(prev => ({ ...prev, image: result.url }))
            } else {
                alert('Gagal mengunggah foto produk.')
            }
        } catch {
            alert('Terjadi kesalahan jaringan saat upload.')
        } finally {
            setUploading(false)
        }
    }

    // Upload QRIS image to Cloudinary via /api/upload
    const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setQrisUploading(true)
        const data = new FormData()
        data.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            })
            if (res.ok) {
                const result = await res.json()
                setFormData(prev => ({ ...prev, qris_image: result.url }))
            } else {
                alert('Gagal mengunggah foto QRIS.')
            }
        } catch {
            alert('Terjadi kesalahan jaringan saat upload QRIS.')
        } finally {
            setQrisUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = '/api/packages'
            const method = isEditing ? 'PUT' : 'POST'
            const body = isEditing ? { ...formData, id: editId } : formData

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
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

    const handleEdit = (pkg: PackageItem) => {
        setFormData({
            name: pkg.name,
            chip: pkg.chip.toString(),
            price: pkg.price.toString(),
            originalPrice: pkg.originalPrice ? pkg.originalPrice.toString() : '',
            image: pkg.image || '',
            badge: pkg.badge || '',
            isPinned: Boolean(pkg.isPinned),
            qris_image: pkg.qris_image || ''
        })
        setEditId(pkg.id)
        setIsEditing(true)
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus paket ini?')) return
        try {
            await fetch(`/api/packages?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            fetchPackages()
        } catch (error) {
            console.error(error)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            chip: '',
            price: '',
            originalPrice: '',
            image: '',
            badge: '',
            isPinned: false,
            qris_image: ''
        })
        setIsEditing(false)
        setEditId(0)
    }

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/packages', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            if (res.ok) {
                fetchPackages()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleTogglePin = async (id: number, currentPinned: boolean) => {
        try {
            const res = await fetch('/api/packages', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, isPinned: !currentPinned })
            })
            if (res.ok) {
                fetchPackages()
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Manajemen Paket & Harga Produk</h1>
                    <p className="text-sm text-gray-400 mt-1">Ubah harga, nominal koin, dan foto produk yang tampil ke member</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm text-sm"
                >
                    <Plus size={18} />
                    <span>Tambah Paket</span>
                </button>
            </div>

            {/* Modal / Card Form Tambah/Edit */}
            {showForm && (
                <div className="bg-[#111622] border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4 animate-in fade-in">
                    <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                        {isEditing ? 'Edit Paket & Harga Produk' : 'Tambah Paket Baru'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Label (e.g. 1B Koin)</label>
                            <input
                                type="text"
                                placeholder="Contoh: 1B Koin"
                                className="w-full bg-[#0a0e17] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Jumlah Chip (dalam satuan M, e.g. 1000 = 1B)</label>
                            <input
                                type="number"
                                placeholder="Contoh: 1000"
                                className="w-full bg-[#0a0e17] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                                value={formData.chip}
                                onChange={e => setFormData({ ...formData, chip: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Harga Jual (Rp)</label>
                            <input
                                type="number"
                                placeholder="Contoh: 65010"
                                className="w-full bg-[#0a0e17] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Harga Normal / Coret (Rp)</label>
                            <input
                                type="number"
                                placeholder="Contoh: 70000"
                                className="w-full bg-[#0a0e17] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                                value={formData.originalPrice}
                                onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Badge Promo (Dropdown Baku)</label>
                            <select
                                className="w-full bg-[#0a0e17] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none cursor-pointer"
                                value={formData.badge}
                                onChange={e => setFormData({ ...formData, badge: e.target.value })}
                            >
                                <option value="">(Tanpa Badge Promo)</option>
                                <option value="Terlaris">Terlaris</option>
                                <option value="Populer">Populer</option>
                                <option value="Hemat">Hemat</option>
                                <option value="Grosir">Grosir</option>
                                <option value="Sultan">Sultan</option>
                                <option value="Best Seller">Best Seller</option>
                                <option value="Promo Kilat">Promo Kilat</option>
                            </select>
                        </div>

                        {/* Upload / Ganti Foto Produk */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Foto Produk Chip (Opsional)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="URL Gambar atau Upload ->"
                                    className="w-full bg-[#0a0e17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                />
                                <label className="cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl flex items-center gap-1 shrink-0 border border-slate-700">
                                    <Upload size={13} />
                                    <span>{uploading ? '...' : 'Pilih'}</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {formData.image && (
                            <div className="sm:col-span-3 flex items-center gap-3 bg-[#0a0e17] p-2.5 rounded-xl border border-slate-800">
                                <span className="text-xs text-slate-400">Preview Foto:</span>
                                <Image src={formData.image} alt="Preview" width={40} height={40} className="w-10 h-10 object-contain rounded border border-slate-700" unoptimized />
                            </div>
                        )}

                        {/* =============================================================== */}
                        {/* FITUR QRIS STATIS PER PRODUK (KHUSUS CS & NOMINAL TERKUNCI)    */}
                        {/* =============================================================== */}
                        <div className="sm:col-span-3 bg-[#0a0e17] p-4 rounded-xl border border-slate-700/80 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <QrCode size={18} className="text-amber-400" />
                                        <h4 className="text-sm font-bold text-white">QRIS Statis Khusus Produk Ini (Nominal Terkunci)</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        CS dapat mengunggah barcode QRIS statis yang <strong>nominalnya sudah pas Rp {formData.price ? Number(formData.price).toLocaleString('id-ID') : '...'}</strong>.
                                        Member cukup scan tanpa perlu pusing mengetik nominal lagi di aplikasi bank.
                                        <br />
                                        <span className="text-slate-500">*Jika belum ditaruh / dikosongkan, sistem otomatis menampilkan QRIS Toko Umum dengan nominal pas sesuai harga paket ini.</span>
                                    </p>
                                </div>
                                {formData.qris_image && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, qris_image: '' }))}
                                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg shrink-0 cursor-pointer"
                                    >
                                        <X size={12} /> Hapus QRIS
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="URL Gambar QRIS (https://... atau /images/...) atau klik Upload ->"
                                    className="flex-1 bg-[#111622] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                                    value={formData.qris_image}
                                    onChange={e => setFormData({ ...formData, qris_image: e.target.value })}
                                />
                                <label className="cursor-pointer px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shrink-0 border border-amber-500/30 transition-colors">
                                    <Upload size={13} />
                                    <span>{qrisUploading ? 'Mengunggah...' : 'Upload File QRIS'}</span>
                                    <input type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" />
                                </label>
                            </div>

                            {formData.qris_image ? (
                                <div className="flex items-center gap-3 bg-[#111622] p-3 rounded-lg border border-emerald-500/30">
                                    <div className="w-14 h-14 bg-white p-1 rounded-md shrink-0 flex items-center justify-center border border-slate-700 relative">
                                        <Image src={formData.qris_image} alt="Preview QRIS" width={56} height={56} className="w-full h-full object-contain" unoptimized />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                            <Check size={13} /> QRIS Statis Nominal Pas Aktif
                                        </span>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{formData.qris_image}</p>
                                        <p className="text-[10px] text-amber-300 mt-0.5">Member yang memilih paket ini akan langsung melihat QRIS nominal pas ini.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[11px] text-slate-400 bg-[#111622] px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                                    <span>Belum ada QRIS statis khusus. Pembelian paket ini otomatis memakai QRIS Toko Umum standar.</span>
                                </div>
                            )}
                        </div>

                        {/* Pin to Top Checkbox */}
                        <div className="sm:col-span-3 flex items-center gap-3 bg-[#0a0e17] p-3 rounded-xl border border-slate-800">
                            <input
                                type="checkbox"
                                id="pinCheckbox"
                                checked={formData.isPinned}
                                onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer accent-amber-500"
                            />
                            <label htmlFor="pinCheckbox" className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 cursor-pointer select-none">
                                <Pin size={13} className="text-amber-400 fill-amber-400" />
                                <span>Taruh di Paling Atas (Tampil Paling Pertama di Halaman Member)</span>
                            </label>
                        </div>

                        <div className="sm:col-span-3 flex justify-end gap-2 pt-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                            >
                                Simpan Paket
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid List Paket */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={`border p-4 rounded-xl relative flex flex-col justify-between transition-all ${
                            pkg.isPinned 
                                ? 'bg-gradient-to-b from-[#18161d] to-[#111622] border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.12)]' 
                                : 'bg-[#111622] border-slate-800'
                        } ${!pkg.isActive ? 'opacity-50' : ''}`}
                    >
                        <div>
                            <div className="flex items-start justify-between mb-3 gap-2">
                                <div className="relative">
                                    {pkg.image ? (
                                        <Image src={pkg.image} alt={pkg.name} width={44} height={44} className="w-11 h-11 object-contain rounded-lg border border-slate-700 bg-black/40 p-1" unoptimized />
                                    ) : (
                                        <div className="w-11 h-11 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
                                            <Package size={20} />
                                        </div>
                                    )}
                                    {pkg.isPinned && (
                                        <span className="absolute -top-1.5 -left-1.5 bg-amber-500 text-black text-[9px] font-black px-1 rounded-full shadow-xs">
                                            #1
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePin(pkg.id, Boolean(pkg.isPinned))}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                            pkg.isPinned 
                                                 ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-xs' 
                                                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
                                        }`}
                                        title={pkg.isPinned ? 'Klik untuk membatalkan pin' : 'Klik untuk menaruh produk ini paling atas'}
                                    >
                                        <Pin size={10} className={pkg.isPinned ? 'fill-amber-300' : ''} />
                                        <span>{pkg.isPinned ? 'PINNED' : 'PIN KE ATAS'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(pkg.id, pkg.isActive)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-opacity ${pkg.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}
                                    >
                                        {pkg.isActive ? 'AKTIF' : 'NONAKTIF'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-white tracking-tight">{pkg.name}</h3>
                                    {pkg.badge && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                            {pkg.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 font-medium">{pkg.chip >= 1000 ? `${pkg.chip / 1000}B` : `${pkg.chip}M`} Chip</p>
                                
                                <div className="pt-2">
                                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                        <p className="text-[10px] text-slate-500 line-through font-mono">
                                            Rp {pkg.originalPrice.toLocaleString('id-ID')}
                                        </p>
                                    )}
                                    <p className="text-sm font-bold text-emerald-400 font-mono">
                                        Rp {pkg.price.toLocaleString('id-ID')}
                                    </p>
                                </div>

                                {/* Status QRIS Produk */}
                                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500">Status QR:</span>
                                    {pkg.qris_image ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                                            <Check size={11} className="text-emerald-400 shrink-0" />
                                            <span>QR Khusus Terpasang</span>
                                        </span>
                                    ) : (
                                        <span className="text-amber-400 font-medium flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30" title="Paket ini menggunakan foto QRIS toko dari Bank & Chip">
                                            <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                                            <span>Fallback QR Toko</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800/80">
                            <button
                                onClick={() => handleEdit(pkg)}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700"
                            >
                                <Edit size={13} />
                                <span>Edit</span>
                            </button>
                            <button
                                onClick={() => handleDelete(pkg.id)}
                                className="py-1.5 px-3 bg-red-950/40 hover:bg-red-900/60 rounded-lg text-red-400 text-xs font-semibold flex items-center justify-center border border-red-800/40"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
