'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/admin/Header'
import { Save, Loader2, Smartphone, MessageCircle, CreditCard } from 'lucide-react'

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
                ...prev[section],
                [field]: value
            }
        }))
    }

    // This helper is for deeply nested properties like config.section.subsection.field
    const updateNestedConfig = (section: string, subsection: string, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subsection]: {
                    ...prev[section][subsection],
                    [field]: value
                }
            }
        }))
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
                                onChange={(e) => updateNestedConfig('contacts', 'whatsapp', 'number', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Username Telegram (Tanpa @)</label>
                            <input
                                type="text"
                                value={config.contacts?.telegram?.username || ''}
                                onChange={(e) => updateNestedConfig('contacts', 'telegram', 'username', e.target.value)}
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
