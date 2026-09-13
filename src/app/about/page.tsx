import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Zap, Clock, Award, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Tentang Kami',
    description: 'Kenali lebih dekat Royal Clover, platform penyedia chip Royal Dream dan layanan bongkaran otomatis terpercaya di Indonesia.'
}

export default function AboutPage() {
    return (
        <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-12 font-inter text-[#f3ecd8] antialiased">
            {/* Header Artikel */}
            <div className="border-b border-[#8a6d38]/20 pb-6 mb-8 text-center sm:text-left">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block mb-3">
                    Profil Platform
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] leading-tight mb-2">
                    Tentang Royal Clover
                </h1>
                <p className="text-xs sm:text-sm text-[#a89f8a] leading-relaxed">
                    Platform top-up chip game resmi dan layanan bongkaran instan bergaransi terpercaya di Indonesia.
                </p>
            </div>

            {/* Konten Artikel */}
            <article className="space-y-8 text-xs sm:text-sm leading-relaxed text-[#f3ecd8]/90">
                {/* Bagian 1 */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        1. Siapa Kami
                    </h2>
                    <p className="text-[#a89f8a]">
                        <strong className="text-[#f3ecd8]">Royal Clover</strong> adalah penyedia solusi digital terkemuka yang didedikasikan untuk memfasilitasi kebutuhan para pemain game daring, khususnya game Royal Dream, dengan layanan top-up chip koin dan pencairan (bongkaran) koin yang cepat, aman, dan transparan.
                    </p>
                    <p className="text-[#a89f8a]">
                        Didirikan dengan komitmen memberikan pengalaman transaksi tanpa hambatan, kami menghubungkan pemain dengan sistem pemrosesan mutasi bank dan QRIS otomatis tanpa perantara manual yang memperlambat proses.
                    </p>
                </section>

                {/* Bagian 2 */}
                <section className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        2. Nilai & Keunggulan Utama
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#17171a] border border-[#8a6d38]/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-[#c5a369]">
                                <Zap size={18} />
                                <h3 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">
                                    Proses Otomatis 1–5 Detik
                                </h3>
                            </div>
                            <p className="text-xs text-[#a89f8a]">
                                Sistem gateway kami langsung mendeteksi pembayaran QRIS atau transfer bank Anda dan mengirim chip ke akun Anda seketika.
                            </p>
                        </div>

                        <div className="bg-[#17171a] border border-[#8a6d38]/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-[#3fa46a]">
                                <ShieldCheck size={18} />
                                <h3 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">
                                    Legal & 100% Bergaransi
                                </h3>
                            </div>
                            <p className="text-xs text-[#a89f8a]">
                                Semua chip bersumber dari jalur resmi game. Kami menjamin keamanan akun dari sanksi sistem maupun pembekuan sepihak.
                            </p>
                        </div>

                        <div className="bg-[#17171a] border border-[#8a6d38]/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-[#e8c883]">
                                <Clock size={18} />
                                <h3 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">
                                    Operasional 24 Jam Nonstop
                                </h3>
                            </div>
                            <p className="text-xs text-[#a89f8a]">
                                Platform beroperasi sepanjang waktu tanpa jam tutup, melayani transaksi Anda tengah malam maupun hari libur nasional.
                            </p>
                        </div>

                        <div className="bg-[#17171a] border border-[#8a6d38]/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-[#c5a369]">
                                <Award size={18} />
                                <h3 className="font-poppins font-bold text-xs sm:text-sm text-[#f3ecd8]">
                                    Harga Kompetitif & Grosir
                                </h3>
                            </div>
                            <p className="text-xs text-[#a89f8a]">
                                Kami menyediakan tier harga bertingkat dengan penawaran grosir khusus untuk pembelian volume besar (5B ke atas).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Bagian 3 */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        3. Komitmen Keamanan & Privasi
                    </h2>
                    <p className="text-[#a89f8a]">
                        Kepercayaan Anda adalah aset utama kami. Oleh karena itu, Royal Clover tidak pernah meminta password, PIN keamanan game, atau kata sandi perbankan Anda. Seluruh transaksi hanya membutuhkan ID Pengguna game publik Anda.
                    </p>
                    <p className="text-[#a89f8a]">
                        Seluruh data pesanan disimpan dengan enkripsi standar industri dan tidak akan pernah diperjualbelikan kepada pihak ketiga manapun.
                    </p>
                </section>

                {/* Callout ke Kontak */}
                <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <h4 className="font-poppins font-bold text-[#f3ecd8] text-sm sm:text-base">
                            Ada Pertanyaan atau Masukan?
                        </h4>
                        <p className="text-xs text-[#a89f8a]">
                            Tim layanan pelanggan kami siap membantu Anda 24 jam sehari via WhatsApp dan Telegram.
                        </p>
                    </div>
                    <Link
                        href="/contact"
                        className="shrink-0 px-4 py-2 rounded-md bg-[#c5a369] hover:bg-[#e8c883] text-[#0d0d0f] font-poppins font-bold text-xs transition-colors"
                    >
                        Hubungi Kami
                    </Link>
                </div>
            </article>
        </main>
    )
}
