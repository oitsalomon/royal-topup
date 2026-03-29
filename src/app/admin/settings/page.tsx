'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/admin/Header'
import { Save, Loader2, Smartphone, MessageCircle, CreditCard, Flame, Plus, Trash2, LayoutGrid } from 'lucide-react'

export default function SettingsPage() {
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data)
                setLoading(false)
            })
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

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(config)
            })

            if (res.ok) {
                alert('Pengaturan berhasil disimpan!')
            } else {
                alert('Gagal menyimpan pengaturan')
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan')
        }
        setSaving(false)
    }

    const updateConfig = (section: string, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...(prev?.[section] || {}),
                [field]: value
            }
        }))
    }

    // This helper is for deeply nested properties like config.section.subsection.field
    const updateNestedConfig = (section: string, subsection: string, field: string, value: any) => {
        setConfig((prev: any) => {
            const sectionData = prev?.[section] || {}
            const subsectionData = sectionData[subsection] || {}

            return {
                ...prev,
                [section]: {
                    ...sectionData,
                    [subsection]: {
                        ...subsectionData,
                        [field]: value
                    }
                }
            }
        })
    }

    if (loading) return <div className="p-8 text-center text-white">Loading settings...</div>

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] pb-20">
            <Header title="Pengaturan Website" subtitle="Kelola link download, kontak CS, dan ID transaksi" />

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

                {/* Download App Section */}
                <div className="bg-[#111111] rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Link Download Aplikasi</h2>
                            <p className="text-sm text-gray-400">Atur link download untuk user</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Link Royal Dream</label>
                            <input
                                type="text"
                                value={config.download_app?.royal_dream || ''}
                                onChange={(e) => updateConfig('download_app', 'royal_dream', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Link Domino RP</label>
                            <input
                                type="text"
                                value={config.download_app?.domino_rp || ''}
                                onChange={(e) => updateConfig('download_app', 'domino_rp', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Link Neo</label>
                            <input
                                type="text"
                                value={config.download_app?.neo || ''}
                                onChange={(e) => updateConfig('download_app', 'neo', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Contacts Section */}
                <div className="bg-[#111111] rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Kontak CS</h2>
                            <p className="text-sm text-gray-400">Atur nomor WhatsApp dan link contact lainnya</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Nomor WhatsApp (Contoh: 62812...)</label>
                            <input
                                type="text"
                                value={config.contacts?.whatsapp?.number || ''}
                                onChange={(e) => {
                                    // Remove all non-numeric characters except +
                                    let val = e.target.value.replace(/[^0-9+]/g, '')
                                    // If user pasted a full URL, try to extract the number
                                    if (e.target.value.includes('wa.me/')) {
                                        val = e.target.value.split('wa.me/')[1]?.replace(/[^0-9]/g, '') || val
                                    }
                                    updateNestedConfig('contacts', 'whatsapp', 'number', val)
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Username Telegram (Tanpa @)</label>
                            <input
                                type="text"
                                value={config.contacts?.telegram?.username || ''}
                                onChange={(e) => {
                                    // Remove @, spaces, and handle full URLs
                                    let val = e.target.value
                                    if (val.includes('t.me/')) {
                                        val = val.split('t.me/')[1] || val
                                    }
                                    val = val.replace('@', '').trim()
                                    updateNestedConfig('contacts', 'telegram', 'username', val)
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Link Live Chat</label>
                            <input
                                type="text"
                                value={config.contacts?.live_chat?.url || ''}
                                onChange={(e) => updateNestedConfig('contacts', 'live_chat', 'url', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Flash Sale Section */}
                <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Flame size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Promo Rush Hour (Flash Sale)</h2>
                            <p className="text-sm text-gray-400">Ubah seluruh website ke mode diskon terbatas</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Harga Promo per 1B (Rp)</label>
                                <input
                                    type="number"
                                    value={config.flash_sale?.promo_price || 63000}
                                    onChange={(e) => updateConfig('flash_sale', 'promo_price', Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Minimal Pembelian (dalam B)</label>
                                <input
                                    type="number"
                                    value={config.flash_sale?.min_amount_b || 1}
                                    onChange={(e) => updateConfig('flash_sale', 'min_amount_b', Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Durasi Promo (Pilih untuk Mereset Waktu)</label>
                                <select
                                    onChange={(e) => {
                                        const hours = Number(e.target.value)
                                        if (hours > 0) {
                                            updateConfig('flash_sale', 'end_time', Date.now() + (hours * 60 * 60 * 1000))
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:outline-none transition-colors"
                                >
                                    <option value="0">-- Atur Durasi --</option>
                                    <option value="0.5">30 Menit</option>
                                    <option value="1">1 Jam</option>
                                    <option value="2">2 Jam</option>
                                    <option value="5">5 Jam</option>
                                    <option value="12">12 Jam</option>
                                    <option value="24">24 Jam</option>
                                </select>
                                {config.flash_sale?.end_time ? (
                                    <p className="text-xs text-emerald-400 mt-2 font-medium">
                                        ⚡ Saat ini diatur agar berakhir pada:<br/>{new Date(config.flash_sale.end_time).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-2">Belum ada durasi yang diatur.</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={config.flash_sale?.active || false}
                                        onChange={(e) => updateConfig('flash_sale', 'active', e.target.checked)}
                                    />
                                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                                    <span className="ml-3 text-sm font-bold text-white uppercase tracking-widest">{config.flash_sale?.active ? 'PROMO AKTIF' : 'NONAKTIF'}</span>
                                </label>
                            </div>
                        </div>
                        {config.flash_sale?.active && (
                            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
                                <p className="text-amber-400 text-sm">
                                    ⚠️ <strong>Peringatan:</strong> Mode Flash Sale sedang aktif! Pengunjung akan melihat antarmuka diskon dan timer hitung mundur. Pastikan Anda sudah menyimpan pembaruan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ID WD Section */}
                <div className="bg-[#111111] rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">ID Penampung WD (User)</h2>
                            <p className="text-sm text-gray-400">ID yang akan muncul di halaman Withdraw user</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">ID Game</label>
                            <input
                                type="text"
                                value={config.id_wd?.value || ''}
                                onChange={(e) => updateConfig('id_wd', 'value', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Nickname Game</label>
                            <input
                                type="text"
                                value={config.id_wd?.nickname || ''}
                                onChange={(e) => updateConfig('id_wd', 'nickname', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="bg-[#111111] rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Sosial Media</h2>
                            <p className="text-sm text-gray-400">Tautan sosial media untuk ditampilkan di footer website</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Facebook</label>
                            <input
                                type="text"
                                placeholder="https://facebook.com/..."
                                value={config.socials?.facebook || ''}
                                onChange={(e) => updateConfig('socials', 'facebook', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Instagram</label>
                            <input
                                type="text"
                                placeholder="https://instagram.com/..."
                                value={config.socials?.instagram || ''}
                                onChange={(e) => updateConfig('socials', 'instagram', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">TikTok</label>
                            <input
                                type="text"
                                placeholder="https://tiktok.com/@..."
                                value={config.socials?.tiktok || ''}
                                onChange={(e) => updateConfig('socials', 'tiktok', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Blogger / Website Lain</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={config.socials?.blogger || ''}
                                onChange={(e) => updateConfig('socials', 'blogger', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>



                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Simpan Perubahan
                    </button>
                </div>

            </div>
        </div>
    )
}
