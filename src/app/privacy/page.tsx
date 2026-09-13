import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Lock, EyeOff } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Kebijakan Privasi',
    description: 'Kebijakan Privasi dan Perlindungan Data Pelanggan di Royal Clover.'
}

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
    return (
        <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-12 font-inter text-[#f3ecd8] antialiased">
            {/* Header Artikel */}
            <div className="border-b border-[#8a6d38]/20 pb-6 mb-8 text-center sm:text-left">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block mb-3">
                    Perlindungan Konsumen
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] leading-tight mb-2">
                    Kebijakan Privasi
                </h1>
                <p className="text-xs sm:text-sm text-[#a89f8a] leading-relaxed">
                    Kami berkomitmen menjaga kerahasiaan dan keamanan data pribadi setiap pengguna yang bertransaksi di Royal Clover.
                </p>
            </div>

            {/* Konten Artikel */}
            <article className="space-y-8 text-xs sm:text-sm leading-relaxed text-[#f3ecd8]/90">

                {/* 1. Informasi yang Dikumpulkan */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        1. Informasi yang Kami Kumpulkan
                    </h2>
                    <p className="text-[#a89f8a]">
                        Untuk memproses pesanan koin chip dan transaksi bongkaran, platform kami hanya mengumpulkan informasi yang esensial, antara lain:
                    </p>
                    <ul className="space-y-2 text-[#a89f8a] pl-4 list-disc">
                        <li>ID Game dan nama panggilan (nickname) dalam game yang Anda inputkan.</li>
                        <li>Nomor kontak WhatsApp (digunakan semata-mata untuk konfirmasi status pesanan dan bantuan kendala teknis).</li>
                        <li>Data mutasi pembayaran (nominal transfer, nomor rekening pengirim / penerima untuk transaksi bongkaran koin).</li>
                    </ul>
                    <div className="bg-[#17171a] border border-[#8a6d38]/30 rounded-lg p-3.5 flex items-start gap-3 mt-2">
                        <Lock size={16} className="text-[#3fa46a] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#a89f8a]">
                            <strong className="text-[#f3ecd8]">Perhatian:</strong> Kami <strong className="text-[#f3ecd8]">TIDAK PERNAH</strong> meminta atau menyimpan kata sandi akun game, kode OTP, atau PIN perbankan Anda.
                        </p>
                    </div>
                </section>

                {/* 2. Penggunaan Informasi */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        2. Bagaimana Kami Menggunakan Informasi Anda
                    </h2>
                    <p className="text-[#a89f8a]">
                        Data yang kami peroleh digunakan secara eksklusif untuk:
                    </p>
                    <ul className="space-y-2 text-[#a89f8a] pl-4 list-disc">
                        <li>Memvalidasi kecocokan pembayaran QRIS/Transfer bank dengan pesanan Anda.</li>
                        <li>Mengirimkan koin chip ke ID akun game tujuan secara instan melalui sistem otomatis.</li>
                        <li>Memberikan notifikasi pembaruan status transaksi jika diperlukan.</li>
                        <li>Mencegah dan mendeteksi tindakan penipuan atau penyalahgunaan layanan perbankan.</li>
                    </ul>
                </section>

                {/* 3. Keamanan Data */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        3. Keamanan & Kerahasiaan Data
                    </h2>
                    <p className="text-[#a89f8a]">
                        Kami menerapkan standar enkripsi data berlapis untuk menjaga server dan database kami dari akses tidak berwenang. Akses internal terhadap data riwayat pesanan dibatasi secara ketat hanya untuk personel Customer Service yang bertugas.
                    </p>
                    <p className="text-[#a89f8a]">
                        Royal Clover menjamin bahwa data pribadi Anda <strong className="text-[#f3ecd8]">tidak akan pernah diperjualbelikan, disewakan, atau dibagikan</strong> kepada pihak ketiga untuk tujuan pemasaran komersial apapun.
                    </p>
                </section>

                {/* 4. Penyimpanan & Penghapusan Data */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        4. Hak Pengguna & Penghapusan Data
                    </h2>
                    <p className="text-[#a89f8a]">
                        Pengguna berhak untuk meminta klarifikasi terkait data transaksi yang tersimpan atau meminta penghapusan riwayat nomor kontak setelah pesanan selesai diproses. Permintaan dapat diajukan secara langsung melalui Customer Service resmi kami.
                    </p>
                </section>

                {/* Callout */}
                <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    <div className="space-y-1 text-center sm:text-left">
                        <h4 className="font-poppins font-bold text-[#f3ecd8] text-sm">
                            Pertanyaan Seputar Privasi Data?
                        </h4>
                        <p className="text-xs text-[#a89f8a]">
                            Hubungi tim kepatuhan dan bantuan kami kapan saja.
                        </p>
                    </div>
                    <Link
                        href="/contact"
                        className="shrink-0 px-4 py-2 rounded-md bg-[#3fa46a] hover:bg-[#358a59] text-white font-poppins font-semibold text-xs transition-colors"
                    >
                        Hubungi Tim Privasi
                    </Link>
                </div>
            </article>
        </main>
    )
}
