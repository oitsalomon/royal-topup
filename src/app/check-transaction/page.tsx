'use client'

import { useState } from 'react'
import {
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    MessageCircle,
    Upload
} from 'lucide-react'

interface Transaction {
    id: number
    trx_id: string | null
    status: string
    amount_chip: number
    amount_money: number
    nickname: string
    user_game_id?: string
    proof_image?: string | null
    game?: { name: string }
    paymentMethod?: { name: string }
    createdAt: string
}

export default function CheckTransactionPage() {
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<Transaction | null>(null)
    const [uploadingProof, setUploadingProof] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [error, setError] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!search.trim()) return

        setLoading(true)
        setError('')
        setResult(null)

        try {
            const res = await fetch(`/api/transactions/track?search=${encodeURIComponent(search.trim())}`)
            const data = await res.json()

            if (res.ok && data?.data) {
                setResult(data.data)
            } else {
                setError(data?.error || 'Tidak ditemukan transaksi dengan nomor WhatsApp atau kode tersebut.')
            }
        } catch {
            setError('Gagal memeriksa transaksi. Periksa koneksi internet Anda.')
        } finally {
            setLoading(false)
        }
    }

    const handleUploadProof = async (file: File) => {
        if (!file || !result) return
        setUploadingProof(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            if (!res.ok) {
                alert('Gagal mengunggah foto. Pastikan format JPG/PNG di bawah 5MB.')
                return
            }
            const data = await res.json()
            if (data.url) {
                const patchRes = await fetch(`/api/transactions/${result.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proof_image: data.url })
                })
                if (patchRes.ok) {
                    setResult(prev => prev ? { ...prev, proof_image: data.url } : null)
                    alert('Foto bukti transaksi berhasil disimpan.')
                } else {
                    alert('Gagal memperbarui bukti transaksi.')
                }
            }
        } catch {
            alert('Terjadi kesalahan jaringan saat upload.')
        } finally {
            setUploadingProof(false)
        }
    }

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num)
    }

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr)
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return dateStr
        }
    }

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
            case 'APPROVED_2':
            case 'SUCCESS':
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#3fa46a] text-white text-xs font-poppins font-semibold">
                        <CheckCircle2 size={14} />
                        <span>Transaksi Berhasil</span>
                    </span>
                )
            case 'DECLINED':
            case 'FAILED':
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#3a3a3f] text-[#f3ecd8] text-xs font-poppins font-semibold border border-red-500/40">
                        <XCircle size={14} className="text-red-400" />
                        <span>Transaksi Dibatalkan</span>
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#17171a] text-[#e8c883] text-xs font-poppins font-semibold border border-[#8a6d38]">
                        <Clock size={14} className="text-[#c5a369]" />
                        <span>Sedang Diproses</span>
                    </span>
                )
        }
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6 sm:space-y-8 font-inter text-[#f3ecd8] antialiased">
            {/* Header Section */}
            <section className="text-center space-y-1.5 max-w-xl mx-auto">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block mb-1">
                    Pelacakan Realtime
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] leading-tight">
                    Cek Status Transaksi
                </h1>
                <p className="text-xs sm:text-sm font-inter text-[#a89f8a] leading-relaxed">
                    Lacak status top-up atau pesanan koin chip Anda secara instan menggunakan Nomor WhatsApp atau Kode Transaksi.
                </p>
            </section>

            {/* Search Card */}
            <section className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-4 sm:p-5 shadow-sm space-y-3">
                <form onSubmit={handleSearch} className="space-y-3">
                    <div>
                        <label className="block text-xs font-inter font-medium text-[#f3ecd8] mb-1">
                            Nomor WhatsApp atau ID Transaksi <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: 081234567890 atau CL-TOPUP-1234"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            required
                            className="w-full bg-[#0d0d0f] border border-[#8a6d38]/40 focus:border-[#c5a369] rounded-md px-3.5 py-2.5 text-base sm:text-sm font-inter text-[#f3ecd8] font-mono outline-none transition-colors placeholder-[#7a766c]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-md bg-[#3fa46a] hover:bg-[#358a59] disabled:opacity-50 text-white font-poppins font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Mencari Data...</span>
                            </>
                        ) : (
                            <>
                                <Search size={15} />
                                <span>Lacak Pesanan</span>
                            </>
                        )}
                    </button>
                </form>
            </section>

            {/* Error Message */}
            {error && (
                <div className="bg-[#17171a] border border-red-500/40 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-red-300">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{error}</p>
                </div>
            )}

            {/* Search Result Card */}
            {result && (
                <section className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#8a6d38]/20">
                        <div>
                            <p className="text-[11px] font-inter text-[#a89f8a]">ID Transaksi</p>
                            <p className="text-sm font-poppins font-bold font-mono text-[#f3ecd8]">
                                {result.trx_id || `TRX-${result.id}`}
                            </p>
                        </div>
                        <div>{renderStatusBadge(result.status)}</div>
                    </div>

                    <div className="space-y-2 text-xs font-inter divide-y divide-[#8a6d38]/15">
                        <div className="pt-2 flex justify-between">
                            <span className="text-[#a89f8a]">Game:</span>
                            <span className="text-[#f3ecd8] font-medium">{result.game?.name || 'Royal Dream'}</span>
                        </div>

                        <div className="pt-2 flex justify-between">
                            <span className="text-[#a89f8a]">Nominal Koin:</span>
                            <span className="text-[#e8c883] font-bold font-mono">
                                {result.amount_chip >= 1 ? `${result.amount_chip}B` : `${result.amount_chip * 1000}M`} Chip
                            </span>
                        </div>

                        {result.user_game_id && (
                            <div className="pt-2 flex justify-between">
                                <span className="text-[#a89f8a]">User ID Game:</span>
                                <span className="text-[#f3ecd8] font-mono">{result.user_game_id}</span>
                            </div>
                        )}

                        <div className="pt-2 flex justify-between">
                            <span className="text-[#a89f8a]">Nickname:</span>
                            <span className="text-[#f3ecd8]">{result.nickname || '-'}</span>
                        </div>

                        <div className="pt-2 flex justify-between">
                            <span className="text-[#a89f8a]">Total Pembayaran:</span>
                            <span className="text-[#f3ecd8] font-bold font-mono">
                                {formatRupiah(result.amount_money)}
                            </span>
                        </div>

                        <div className="pt-2 flex justify-between">
                            <span className="text-[#a89f8a]">Metode Pembayaran:</span>
                            <span className="text-[#f3ecd8]">{result.paymentMethod?.name || 'QRIS'}</span>
                        </div>

                        <div className="pt-2 flex justify-between">
                            <span className="text-[#a89f8a]">Waktu Transaksi:</span>
                            <span className="text-[#a89f8a] font-mono">{formatDate(result.createdAt)}</span>
                        </div>

                        {/* Bukti Pembayaran / Pengiriman */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[#a89f8a]">Bukti Transaksi:</span>
                            <div className="flex items-center gap-2">
                                {result.proof_image ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewImage(result.proof_image || null)}
                                            className="text-xs text-[#c5a369] underline font-medium hover:text-[#e8c883]"
                                        >
                                            Lihat Bukti Foto
                                        </button>
                                        {(result.status === 'PENDING' || result.status === 'UNPAID') && (
                                            <label className="cursor-pointer px-2.5 py-1 rounded bg-[#0d0d0f] hover:bg-[#222226] border border-[#8a6d38]/50 text-[#f3ecd8] text-[11px] font-medium transition-colors flex items-center gap-1">
                                                <Upload size={11} />
                                                <span>{uploadingProof ? 'Mengunggah...' : 'Ganti Foto'}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={uploadingProof}
                                                    onChange={e => {
                                                        const f = e.target.files?.[0]
                                                        if (f) handleUploadProof(f)
                                                    }}
                                                    onClick={e => { (e.target as HTMLInputElement).value = '' }}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </>
                                ) : (
                                    (result.status === 'PENDING' || result.status === 'UNPAID') ? (
                                        <label className="cursor-pointer px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium transition-colors flex items-center gap-1">
                                            <Upload size={11} />
                                            <span>{uploadingProof ? 'Mengunggah...' : 'Upload Bukti Foto'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={uploadingProof}
                                                onChange={e => {
                                                    const f = e.target.files?.[0]
                                                    if (f) handleUploadProof(f)
                                                }}
                                                onClick={e => { (e.target as HTMLInputElement).value = '' }}
                                                className="hidden"
                                            />
                                        </label>
                                    ) : (
                                        <span className="text-[#7a766c] text-[11px] italic">Tidak ada bukti</span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <a
                            href="https://wa.me/6281234567890"
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 rounded-md bg-[#3a3a3f] hover:bg-[#48484e] text-[#f3ecd8] font-poppins font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 text-center"
                        >
                            <MessageCircle size={14} className="text-[#c5a369]" />
                            <span>Konfirmasi ke Admin CS</span>
                        </a>
                    </div>
                </section>
            )}

            {/* Modal Preview Bukti */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                >
                    <div className="relative max-w-lg w-full bg-[#17171a] border border-[#8a6d38]/50 rounded-xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-[#f3ecd8] uppercase">Foto Bukti Transaksi</h4>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
                            >
                                Tutup
                            </button>
                        </div>
                        <img
                            src={previewImage}
                            alt="Bukti Preview"
                            className="w-full max-h-[70vh] object-contain rounded-lg border border-white/10"
                        />
                    </div>
                </div>
            )}
        </main>
    )
}
