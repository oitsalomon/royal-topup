'use client'

import { useState } from 'react'
import Header from '@/components/admin/Header'
import { Save, Loader2, Plus, Trash2, LayoutGrid, TrendingUp, Flame, Zap, Snowflake } from 'lucide-react'

interface RtpItem {
    game: string
    room: string
    percentage: number
    status: string
}

interface RtpClientProps {
    initialConfig: any
}

export default function RtpClient({ initialConfig }: RtpClientProps) {
    const [config, setConfig] = useState<any>(initialConfig)
    const [saving, setSaving] = useState(false)

    const rtpList: RtpItem[] = config?.rtp_config || []

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

    const handleSave = async (newList: RtpItem[]) => {
        setSaving(true)
        const newConfig = { ...config, rtp_config: newList }
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newConfig)
            })

            if (res.ok) {
                setConfig(newConfig)
                alert('Data RTP berhasil diperbarui!')
            } else {
                alert('Gagal menyimpan data')
            }
        } catch (error) {
            console.error(error)
            alert('Terjadi kesalahan')
        }
        setSaving(false)
    }

    const addRtp = () => {
        const newList = [...rtpList, { game: '', room: '', percentage: 90, status: 'HOT' }]
        setConfig({ ...config, rtp_config: newList })
    }

    const updateRtp = (idx: number, field: keyof RtpItem, value: any) => {
        const newList = [...rtpList]
        newList[idx] = { ...newList[idx], [field]: value }
        setConfig({ ...config, rtp_config: newList })
    }

    const removeRtp = (idx: number) => {
        if (!confirm('Hapus data RTP ini?')) return
        const newList = rtpList.filter((_, i) => i !== idx)
        setConfig({ ...config, rtp_config: newList })
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] pb-20">
            <Header 
                title="Manajemen Live RTP" 
                subtitle="Atur persentase kemenangan game yang tampil di halaman utama" 
            />

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="bg-[#111111] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-gradient-to-r from-amber-500/5 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-outfit">Daftar RTP Gacor</h2>
                                <p className="text-sm text-gray-500">Live data untuk Landing Page</p>
                            </div>
                        </div>

                        <button
                            onClick={addRtp}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
                        >
                            <Plus size={18} /> Tambah Game
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        {rtpList.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {rtpList.map((item, idx) => (
                                    <div key={idx} className="group relative bg-white/5 border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.07] hover:border-white/10">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                            {/* Game Name */}
                                            <div className="md:col-span-4">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nama Game</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                        <LayoutGrid size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Contoh: Royal Dream"
                                                        value={item.game}
                                                        onChange={(e) => updateRtp(idx, 'game', e.target.value)}
                                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            {/* Room Name */}
                                            <div className="md:col-span-3">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Room / Meja</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Domino"
                                                    value={item.room}
                                                    onChange={(e) => updateRtp(idx, 'room', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors"
                                                />
                                            </div>

                                            {/* Percentage */}
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">RTP (%)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        value={item.percentage}
                                                        onChange={(e) => updateRtp(idx, 'percentage', Number(e.target.value))}
                                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-bold focus:border-amber-500 focus:outline-none transition-colors text-center"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">%</div>
                                                </div>
                                            </div>

                                            {/* Status Selector */}
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Status</label>
                                                <div className="relative">
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => updateRtp(idx, 'status', e.target.value)}
                                                        className="w-full pl-4 pr-10 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors appearance-none"
                                                    >
                                                        <option value="HOT">🔥 HOT</option>
                                                        <option value="WARM">⚡ WARM</option>
                                                        <option value="COLD">❄️ COLD</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                                        ▼
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <div className="md:col-span-1">
                                                <button
                                                    onClick={() => removeRtp(idx)}
                                                    className="w-full h-[46px] rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group/del"
                                                >
                                                    <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Status Visual Indicator */}
                                        <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4">
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${
                                                        item.status === 'HOT' ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                        item.status === 'WARM' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                                                        'bg-gradient-to-r from-blue-400 to-cyan-500'
                                                    }`}
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.status === 'HOT' ? <Flame size={14} className="text-red-500 animate-pulse" /> : 
                                                 item.status === 'WARM' ? <Zap size={14} className="text-amber-400" /> : 
                                                 <Snowflake size={14} className="text-cyan-400" />}
                                                <span className={`text-[10px] font-bold tracking-widest ${
                                                    item.status === 'HOT' ? 'text-red-500' :
                                                    item.status === 'WARM' ? 'text-amber-400' :
                                                    'text-cyan-400'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl group hover:border-amber-500/20 transition-colors">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={40} />
                                </div>
                                <h3 className="text-white font-bold text-lg">Belum ada data RTP</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">Klik tombol "Tambah Game" di atas untuk mulai menambahkan data Live RTP Clover.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end">
                        <button
                            onClick={() => handleSave(rtpList)}
                            disabled={saving}
                            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-3"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Simpan Live RTP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
