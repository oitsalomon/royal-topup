'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Gift, Store } from 'lucide-react'

interface PromoPackage {
    id: number
    name: string
    chip: number
    price: number
}

interface StorePromoConfig {
    id: number
    store_name: string
    isPromoActive: boolean
    promoTitle: string
    packages: PromoPackage[]
}

export default function PromoPage() {
    const [configs, setConfigs] = useState<StorePromoConfig[]>([])
    const [selectedStore, setSelectedStore] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form Data
    const [currentConfig, setCurrentConfig] = useState<StorePromoConfig | null>(null)

    // Load Data
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/internal/promos')
            const data = await res.json()
            if (Array.isArray(data)) setConfigs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Handle Store Selection
    const handleSelectLoveStore = (storeName: string) => {
        setSelectedStore(storeName)
        const exist = configs.find(c => c.store_name === storeName)
        if (exist) {
            setCurrentConfig(JSON.parse(JSON.stringify(exist))) // Deep copy
        } else {
            // Default blank config
            setCurrentConfig({
                id: 0,
                store_name: storeName,
                isPromoActive: false,
                promoTitle: 'Promo Spesial',
                packages: []
            })
        }
    }

    const handleSave = async () => {
        if (!currentConfig) return
        setSaving(true)
        try {
            const res = await fetch('/api/internal/promos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentConfig)
            })
            if (res.ok) {
                alert('Berhasil menyimpan konfigurasi promo!')
                fetchData() // Refresh list
            } else {
                alert('Gagal menyimpan')
            }
        } catch (e) {
            console.error(e)
            alert('Error network')
        } finally {
            setSaving(false)
        }
    }

    const addPackage = () => {
        if (!currentConfig) return
        setCurrentConfig({
            ...currentConfig,
            packages: [
                ...currentConfig.packages,
                { id: Math.random(), name: 'Paket Hemat', chip: 100, price: 50000 } // Temp ID
            ]
        })
    }

    const removePackage = (index: number) => {
        if (!currentConfig) return
        const newPkgs = [...currentConfig.packages]
        newPkgs.splice(index, 1)
        setCurrentConfig({ ...currentConfig, packages: newPkgs })
    }

    // Unique Stores from existing data + presets
    // In real app maybe fetch unique store names from Games
    const knownStores = ['Nova Store', 'Royal Store', 'Sultan Store', 'General']

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Gift className="text-purple-400" />
                Manajemen Promo & Diskon
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Store Selector */}
                <div className="glass p-6 rounded-2xl h-fit">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Store size={18} />
                        Pilih Toko
                    </h3>
                    <div className="space-y-2">
                        {knownStores.map(store => {
                            const active = configs.find(c => c.store_name === store && c.isPromoActive)
                            return (
                                <button
                                    key={store}
                                    onClick={() => handleSelectLoveStore(store)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${selectedStore === store
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                        : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{store}</span>
                                        {active && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">AKTIF</span>}
                                    </div>
                                </button>
                            )
                        })}

                        <div className="pt-4 mt-4 border-t border-white/5">
                            <p className="text-xs text-gray-500 mb-2">Atau ketik nama toko lain:</p>
                            <input
                                type="text"
                                placeholder="Nama Toko Baru..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSelectLoveStore(e.currentTarget.value)
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Config Editor */}
                <div className="md:col-span-2 space-y-6">
                    {selectedStore ? (
                        currentConfig && (
                            <div className="glass p-8 rounded-2xl animate-in fade-in slide-in-from-right-4">
                                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedStore}</h2>
                                        <p className="text-gray-400 text-sm">Konfigurasi Promo untuk semua game di toko ini.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold ${currentConfig.isPromoActive ? 'text-green-400' : 'text-gray-500'}`}>
                                            {currentConfig.isPromoActive ? 'PROMO AKTIF' : 'NON-AKTIF'}
                                        </span>
                                        <div
                                            onClick={() => setCurrentConfig({ ...currentConfig, isPromoActive: !currentConfig.isPromoActive })}
                                            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${currentConfig.isPromoActive ? 'bg-green-500' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${currentConfig.isPromoActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400">Judul Promo (Tampil di User)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold focus:border-purple-500 outline-none"
                                            value={currentConfig.promoTitle}
                                            onChange={e => setCurrentConfig({ ...currentConfig, promoTitle: e.target.value })}
                                            placeholder="Contoh: PROMO LEBARAN"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-xs text-gray-400">Daftar Paket Promo</label>
                                            <button
                                                onClick={addPackage}
                                                className="px-3 py-1.5 bg-black/40 hover:bg-white/10 text-white rounded-lg text-xs flex items-center gap-1 transition-colors border border-white/10"
                                            >
                                                <Plus size={14} /> Tambah Paket
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {currentConfig.packages.length === 0 && (
                                                <div className="text-center py-8 bg-black/20 rounded-xl border border-white/5 border-dashed">
                                                    <p className="text-gray-500 text-sm">Belum ada paket promo.</p>
                                                </div>
                                            )}
                                            {currentConfig.packages.map((pkg, idx) => (
                                                <div key={pkg.id || idx} className="grid grid-cols-12 gap-3 items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <div className="col-span-4">
                                                        <input
                                                            type="text" placeholder="Nama Paket"
                                                            className="w-full bg-transparent text-white text-sm border-none focus:ring-0 p-0 placeholder-gray-600"
                                                            value={pkg.name}
                                                            onChange={e => {
                                                                const newPkgs = [...currentConfig.packages]
                                                                newPkgs[idx].name = e.target.value
                                                                setCurrentConfig({ ...currentConfig, packages: newPkgs })
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number" placeholder="100"
                                                                className="w-full bg-transparent text-yellow-400 font-bold text-sm border-none focus:ring-0 p-0 text-right"
                                                                value={pkg.chip || ''}
                                                                onChange={e => {
                                                                    const newPkgs = [...currentConfig.packages]
                                                                    newPkgs[idx].chip = Number(e.target.value)
                                                                    setCurrentConfig({ ...currentConfig, packages: newPkgs })
                                                                }}
                                                            />
                                                            <span className="text-xs text-gray-500">M</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-green-500">Rp</span>
                                                            <input
                                                                type="number" placeholder="50000"
                                                                className="w-full bg-transparent text-white font-bold text-sm border-none focus:ring-0 p-0"
                                                                value={pkg.price || ''}
                                                                onChange={e => {
                                                                    const newPkgs = [...currentConfig.packages]
                                                                    newPkgs[idx].price = Number(e.target.value)
                                                                    setCurrentConfig({ ...currentConfig, packages: newPkgs })
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-1 flex justify-end">
                                                        <button
                                                            onClick={() => removePackage(idx)}
                                                            className="text-red-400 hover:text-red-300 p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex justify-end">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
                                                }`}
                                        >
                                            <Save size={20} />
                                            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
                            <Store size={48} className="text-gray-500 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Pilih Toko</h3>
                            <p className="text-gray-400">Silakan pilih toko di sebelah kiri untuk mengatur promo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
