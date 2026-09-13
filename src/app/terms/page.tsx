import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Syarat & Ketentuan',
    description: 'Syarat dan Ketentuan layanan resmi platform Royal Clover.'
}

export const dynamic = 'force-dynamic'

export default function TermsPage() {
    return (
        <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-12 font-inter text-[#f3ecd8] antialiased">
            {/* Header Artikel */}
            <div className="border-b border-[#8a6d38]/20 pb-6 mb-8 text-center sm:text-left">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block mb-3">
                    Dokumen Legal
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] leading-tight mb-2">
                    Syarat & Ketentuan Layanan
                </h1>
                <p className="text-xs sm:text-sm text-[#a89f8a] leading-relaxed">
                    Harap membaca seluruh syarat dan ketentuan berikut sebelum melakukan transaksi di platform Royal Clover.
                </p>
            </div>

            {/* Konten Artikel */}
            <article className="space-y-8 text-xs sm:text-sm leading-relaxed text-[#f3ecd8]/90">

                {/* 1. Ketentuan Umum */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        1. Ketentuan Umum
                    </h2>
                    <p className="text-[#a89f8a]">
                        Dengan mengakses dan melakukan pemesanan di situs <strong className="text-[#f3ecd8]">Royal Clover</strong>, pengguna dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan layanan yang berlaku tanpa syarat.
                    </p>
                    <ul className="space-y-2 text-[#a89f8a] pl-4 list-disc">
                        <li>Pengguna bertanggung jawab penuh atas kebenaran data ID Game dan nomor akun yang diinputkan saat pemesanan.</li>
                        <li>Layanan kami beroperasi 24 jam nonstop untuk proses otomatis, kecuali terdapat gangguan dari pihak penyedia pembayaran perbankan/QRIS atau pemeliharaan server game terkait.</li>
                    </ul>
                </section>

                {/* 2. Pembayaran & Konfirmasi */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        2. Pembayaran & Validasi Transaksi
                    </h2>
                    <p className="text-[#a89f8a]">
                        Seluruh transaksi pembayaran diproses melalui kode bayar QRIS atau nomor rekening resmi yang tertera pada halaman rincian pesanan.
                    </p>
                    <ul className="space-y-2 text-[#a89f8a] pl-4 list-disc">
                        <li>Pembeli <strong className="text-[#f3ecd8]">wajib mentransfer nominal tepat hingga 3 digit terakhir (kode unik)</strong> agar sistem mutasi kami dapat memverifikasi pembayaran secara instan dalam 1–5 detik.</li>
                        <li>Kesalahan transfer tanpa kode unik dapat menyebabkan keterlambatan verifikasi dan memerlukan pengecekan manual oleh tim Customer Service.</li>
                    </ul>
                </section>

                {/* 3. Pengiriman Koin Chip */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        3. Pengiriman Koin / Chip Game
                    </h2>
                    <p className="text-[#a89f8a]">
                        Pengiriman chip dilakukan secara langsung ke akun game yang diisi oleh pembeli:
                    </p>
                    <ul className="space-y-2 text-[#a89f8a] pl-4 list-disc">
                        <li>Pengiriman otomatis umumnya memakan waktu antara 1 hingga 5 detik setelah pembayaran divalidasi.</li>
                        <li>Apabila dalam waktu 15 menit produk belum masuk, pembeli dipersilakan menghubungi Customer Service dengan menyertakan bukti transfer dan ID transaksi.</li>
                    </ul>
                </section>

                {/* 4. Kebijakan Pembatalan & Pengembalian Dana */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        4. Pembatalan & Pengembalian Dana (Refund)
                    </h2>
                    <ul className="space-y-2 text-[#a89f8a] pl-4 list-disc">
                        <li>Pesanan yang sudah berhasil dikirimkan ke ID Game yang diinputkan pembeli <strong className="text-[#f3ecd8]">tidak dapat dibatalkan atau ditarik kembali</strong> dengan alasan apapun.</li>
                        <li>Pengembalian dana (refund) hanya berlaku jika terjadi kegagalan sistem pengiriman permanen dari pihak kami dan koin terbukti belum diterima di akun pembeli.</li>
                        <li>Kesalahan input ID Game oleh pembeli menjadi tanggung jawab pribadi pembeli.</li>
                    </ul>
                </section>

                {/* 5. Keamanan & Larangan */}
                <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-poppins font-bold text-[#c5a369]">
                        5. Batasan Tanggung Jawab & Larangan
                    </h2>
                    <p className="text-[#a89f8a]">
                        Dilarang keras menggunakan metode pembayaran ilegal, kartu curian, atau manipulasi bukti transaksi. Segala bentuk kecurangan akan dilaporkan ke pihak berwajib dan akun yang bersangkutan akan diblokir permanen.
                    </p>
                </section>

                {/* Callout Bantuan */}
                <div className="bg-[#17171a] border border-[#8a6d38]/40 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    <div className="space-y-1 text-center sm:text-left">
                        <h4 className="font-poppins font-bold text-[#f3ecd8] text-sm">
                            Butuh Bantuan Mengenai Ketentuan Layanan?
                        </h4>
                        <p className="text-xs text-[#a89f8a]">
                            Tim CS kami siap menjawab pertanyaan seputar transaksi Anda.
                        </p>
                    </div>
                    <Link
                        href="/contact"
                        className="shrink-0 px-4 py-2 rounded-md bg-[#3fa46a] hover:bg-[#358a59] text-white font-poppins font-semibold text-xs transition-colors"
                    >
                        Hubungi CS Kami
                    </Link>
                </div>
            </article>
        </main>
    )
}
