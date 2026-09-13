'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useConfig } from '@/contexts/ConfigContext'
import { MessageCircle, Send, Instagram, ShieldCheck, Zap } from 'lucide-react'

export function SiteFooter() {
    const pathname = usePathname()
    const { config } = useConfig()

    // Hide footer on admin routes
    if (pathname?.startsWith('/admin')) return null

    const waNumber = (config?.contacts?.whatsapp?.number || '').replace(/[^0-9]/g, '')
    const waLink = waNumber ? `https://wa.me/${waNumber}` : '/contact'
    const tgLink = config?.contacts?.telegram?.url || '/contact'
    const igLink = config?.contacts?.instagram?.url || '/contact'

    return (
        <footer className="w-full bg-[#0d0d0f] border-t border-[#8a6d38]/20 mt-16 pt-12 pb-10 px-4 sm:px-6 font-inter text-[#a89f8a]">
            <div className="max-w-4xl mx-auto">
                {/* Top Section: Brand & Quick Trust Features */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 pb-10 border-b border-[#8a6d38]/15">
                    {/* Brand column */}
                    <div className="max-w-sm space-y-3">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-full bg-[#0d0d0f] border border-[#c5a369]/60 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-[#c5a369] transition-colors">
                                <Image
                                    src="/images/clover-logo.webp"
                                    alt="Royal Clover"
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-lg font-poppins font-bold text-[#c5a369] tracking-tight">
                                Royal Clover
                            </span>
                        </Link>
                        <p className="text-xs text-[#a89f8a] leading-relaxed">
                            Penyedia layanan top-up chip Royal Dream dan bongkaran instan bergaransi resmi. Proses cepat 1–5 detik, aman, dan beroperasi 24 jam nonstop setiap hari.
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-[#c5a369]">
                            <span className="inline-flex items-center gap-1 bg-[#17171a] px-2 py-0.5 rounded border border-[#8a6d38]/30">
                                <Zap size={12} className="text-[#e8c883]" /> Proses 1-5 Detik
                            </span>
                            <span className="inline-flex items-center gap-1 bg-[#17171a] px-2 py-0.5 rounded border border-[#8a6d38]/30">
                                <ShieldCheck size={12} className="text-[#3fa46a]" /> Aman & Bergaransi
                            </span>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="grid grid-cols-2 gap-8 text-xs">
                        <div className="space-y-2.5">
                            <h4 className="font-poppins font-bold text-[#f3ecd8] uppercase tracking-wider text-[11px]">
                                Layanan
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/" className="hover:text-[#c5a369] transition-colors">
                                        Top Up Chip
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/withdraw/royal-dream" className="hover:text-[#c5a369] transition-colors">
                                        Bongkaran Auto
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/check-transaction" className="hover:text-[#c5a369] transition-colors">
                                        Cek Status Transaksi
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/login" className="hover:text-[#c5a369] transition-colors">
                                        Login Member
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-2.5">
                            <h4 className="font-poppins font-bold text-[#f3ecd8] uppercase tracking-wider text-[11px]">
                                Informasi & Legal
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/about" className="hover:text-[#c5a369] transition-colors">
                                        Tentang Kami
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/terms" className="hover:text-[#c5a369] transition-colors">
                                        Syarat & Ketentuan
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy" className="hover:text-[#c5a369] transition-colors">
                                        Kebijakan Privasi
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="hover:text-[#c5a369] transition-colors">
                                        Kontak & Bantuan
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Social Media Icons + Copyright */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Outline Social Icons */}
                    <div className="flex items-center gap-3">
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="WhatsApp Customer Service"
                            className="w-9 h-9 rounded-full border border-[#8a6d38] text-[#c5a369] flex items-center justify-center hover:border-[#e8c883] hover:text-[#e8c883] hover:bg-[#17171a] transition-all shadow-sm"
                        >
                            <MessageCircle size={17} />
                        </a>
                        <a
                            href={tgLink}
                            target={tgLink.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            aria-label="Telegram Channel"
                            className="w-9 h-9 rounded-full border border-[#8a6d38] text-[#c5a369] flex items-center justify-center hover:border-[#e8c883] hover:text-[#e8c883] hover:bg-[#17171a] transition-all shadow-sm"
                        >
                            <Send size={16} />
                        </a>
                        <a
                            href={igLink}
                            target={igLink.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="w-9 h-9 rounded-full border border-[#8a6d38] text-[#c5a369] flex items-center justify-center hover:border-[#e8c883] hover:text-[#e8c883] hover:bg-[#17171a] transition-all shadow-sm"
                        >
                            <Instagram size={17} />
                        </a>
                    </div>

                    {/* Clean Copyright text */}
                    <p className="text-[11px] text-[#8a6d38] text-center sm:text-right">
                        &copy; 2026 Royal Clover. Hak Cipta Dilindungi.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default SiteFooter
