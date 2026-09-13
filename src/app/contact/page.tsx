import { Metadata } from 'next'
import { MessageCircle, Send, Clock, ShieldCheck, Mail, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Kontak Kami',
    description: 'Hubungi Customer Service resmi Royal Clover 24 jam nonstop via WhatsApp atau Telegram.'
}

export default function ContactPage() {
    return (
        <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-12 font-inter text-[#f3ecd8] antialiased">
            {/* Header */}
            <div className="border-b border-[#8a6d38]/20 pb-6 mb-8 text-center sm:text-left">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block mb-3">
                    Pusat Bantuan
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] leading-tight mb-2">
                    Kontak & Bantuan Resmi
                </h1>
                <p className="text-xs sm:text-sm text-[#a89f8a] leading-relaxed">
                    Tim Customer Service kami siap melayani dan menyelesaikan kendala transaksi Anda selama 24 jam nonstop.
                </p>
            </div>

            <div className="space-y-6">
                {/* Official Contact Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* WhatsApp */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-[#0d0d0f] border border-[#3fa46a]/60 text-[#3fa46a] flex items-center justify-center">
                                <MessageCircle size={20} />
                            </div>
                            <h2 className="font-poppins font-bold text-base text-[#f3ecd8]">
                                WhatsApp CS 24 Jam
                            </h2>
                            <p className="text-xs text-[#a89f8a] leading-relaxed">
                                Jalur respon tercepat untuk konfirmasi pembayaran, bantuan pengiriman koin, dan klaim garansi transaksi.
                            </p>
                        </div>
                        <a
                            href="https://wa.me/6281234567890"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-md bg-[#3fa46a] hover:bg-[#358a59] text-white font-poppins font-semibold text-xs text-center transition-colors shadow-sm block"
                        >
                            Chat WhatsApp Sekarang
                        </a>
                    </div>

                    {/* Telegram */}
                    <div className="bg-[#17171a] border border-[#8a6d38]/35 rounded-lg p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-[#0d0d0f] border border-[#c5a369]/60 text-[#c5a369] flex items-center justify-center">
                                <Send size={20} />
                            </div>
                            <h2 className="font-poppins font-bold text-base text-[#f3ecd8]">
                                Telegram Channel & CS
                            </h2>
                            <p className="text-xs text-[#a89f8a] leading-relaxed">
                                Dapatkan info promo eksklusif, pengumuman restock chip, serta bantuan pesan instan melalui Telegram.
                            </p>
                        </div>
                        <a
                            href="https://t.me/royalclover"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-md bg-[#17171a] hover:bg-[#202024] border border-[#c5a369] text-[#c5a369] hover:text-[#e8c883] font-poppins font-semibold text-xs text-center transition-colors block"
                        >
                            Buka Telegram
                        </a>
                    </div>
                </div>

                {/* Jam Operasional & Layanan Card */}
                <div className="bg-[#17171a] border border-[#8a6d38]/25 rounded-lg p-5 sm:p-6 space-y-4">
                    <h3 className="font-poppins font-bold text-sm sm:text-base text-[#f3ecd8] flex items-center gap-2">
                        <Clock size={16} className="text-[#c5a369]" />
                        Waktu Operasional & Penanganan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                            <span className="font-semibold text-[#f3ecd8] block">Sistem Otomatis</span>
                            <p className="text-[#a89f8a]">24 Jam Penuh / 7 Hari Seminggu (Nonstop tanpa libur).</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-[#f3ecd8] block">Layanan Customer Service</span>
                            <p className="text-[#a89f8a]">Setiap hari pukul 08.00 – 02.00 WIB (respon tercepat).</p>
                        </div>
                    </div>
                </div>

                {/* Catatan Penting Keamanan */}
                <div className="bg-[#17171a] border border-[#8a6d38]/25 rounded-lg p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[#c5a369]">
                        <ShieldCheck size={18} />
                        <h4 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">
                            Pemberitahuan Keamanan
                        </h4>
                    </div>
                    <ul className="text-xs text-[#a89f8a] space-y-1.5 list-disc list-inside">
                        <li>Admin Royal Clover tidak pernah meminta kata sandi / password game Anda.</li>
                        <li>Pastikan hanya bertransaksi dan mentransfer ke rekening resmi yang tertera di situs resmi <strong className="text-[#f3ecd8]">Royal Clover</strong>.</li>
                        <li>Hati-hati terhadap akun palsu yang mengatasnamakan admin Royal Clover di luar kontak resmi di halaman ini.</li>
                    </ul>
                </div>
            </div>
        </main>
    )
}
