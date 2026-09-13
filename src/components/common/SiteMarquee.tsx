'use client'

import { usePathname } from 'next/navigation'

export function SiteMarquee() {
    const pathname = usePathname()
    if (pathname?.startsWith('/admin')) return null

    return (
        <aside className="w-full bg-[#17171a] border-b border-[#8a6d38]/30 overflow-hidden py-1.5 px-3 z-30 relative">
            <div className="flex items-center gap-3">
                <span className="shrink-0 text-[10px] font-poppins font-bold uppercase tracking-wider text-[#e8c883] bg-[#0d0d0f] px-2 py-0.5 rounded-[4px] border border-[#8a6d38]/40">
                    Info
                </span>
                <div className="overflow-hidden whitespace-nowrap w-full">
                    <div className="animate-marquee inline-block text-[11px] sm:text-xs text-[#f3ecd8]">
                        <span className="mr-8">Top Up Chip Royal Dream resmi & bergaransi 24 jam nonstop</span>
                        <span className="mr-8 text-[#c5a369]">•</span>
                        <span className="mr-8">Proses otomatis 1-5 detik langsung masuk ke akun game</span>
                        <span className="mr-8 text-[#c5a369]">•</span>
                        <span className="mr-8">Dapatkan potongan harga grosir untuk pembelian 5B ke atas</span>
                        <span className="mr-8 text-[#c5a369]">•</span>
                        <span className="mr-8">Butuh bantuan? Hubungi admin resmi kami melalui WhatsApp atau Telegram</span>
                        <span className="mr-8 text-[#c5a369]">•</span>
                        <span className="mr-8">Top Up Chip Royal Dream resmi & bergaransi 24 jam nonstop</span>
                        <span className="mr-8 text-[#c5a369]">•</span>
                        <span className="mr-8">Proses otomatis 1-5 detik langsung masuk ke akun game</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default SiteMarquee
