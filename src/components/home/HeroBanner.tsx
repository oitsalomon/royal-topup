'use client'
import { ArrowRight, Zap, Star, Sparkles, Gem, Gift, Users } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthProvider'
import Link from 'next/link'

interface HeroBannerProps {
    games: any[]
    config: any
}

export default function HeroBanner({ games, config }: HeroBannerProps) {
    const { user } = useAuth()

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050912]">

            {/* Referral Promotion Banner (Only for Non-Logged-in Users) */}
            {/* Referral Promotion Banner (Only for Non-Logged-in Users) */}
            {!user && (
                <div className="absolute top-[80px] left-0 w-full overflow-hidden bg-emerald-900/40 backdrop-blur-md z-20 border-y border-emerald-500/20 h-10 flex items-center">
                    <div className="flex whitespace-nowrap animate-marquee-scroll w-max hover:[animation-play-state:paused]">
                        {/* Duplicate content enough times to ensure seamless loop */}
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-12 px-6">
                                <span className="flex items-center gap-2 text-emerald-300 font-bold text-sm tracking-wide">
                                    <Gift className="w-4 h-4 text-amber-400" />
                                    <span>Dapatkan Bonus Saldo Melimpah! Bagikan Link Referralmu Sekarang.</span>
                                </span>
                                <span className="flex items-center gap-2 text-white font-medium text-sm tracking-wide">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    <span>Program Referral: Cashback <span className="text-amber-400 font-bold">Rp 750 / 1B Chip</span> (Tanpa Batas!)</span>
                                </span>
                                <Link href="/register" className="px-3 py-0.5 rounded-full bg-emerald-500 text-black font-black text-[10px] hover:bg-emerald-400 transition-colors uppercase tracking-wider">
                                    Daftar
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 1. LAYER: Dynamic Luxurious Background */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Gold Orb */}
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
                {/* Platinum/Cyan Orb */}
                <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px] animate-float" />

                {/* Moving Stars / Particles */}
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-32">

                {/* 2. CENTERED LOGO (The "Sultan" Identity) */}
                <div className="relative inline-block mb-12 group animate-in fade-in zoom-in duration-1000">
                    <div className="absolute inset-0 bg-emerald-500/30 blur-[60px] rounded-full group-hover:bg-emerald-500/40 transition-all duration-500" />
                    <Image
                        src="/images/clover-logo.png"
                        alt="Clover Store Logo"
                        width={192}
                        height={192}
                        priority
                        className="w-32 h-32 md:w-48 md:h-48 relative z-10 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)] transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute -top-4 -right-4 animate-bounce delay-100">
                        <Sparkles className="text-amber-400 w-8 h-8 drop-shadow-lg" fill="currentColor" />
                    </div>
                </div>

                {/* 3. PREMIUM TYPOGRAPHY */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 leading-[1.1] drop-shadow-2xl">
                    <span className="block text-2xl md:text-3xl font-bold tracking-[0.5em] text-amber-500 uppercase mb-4 animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-200">
                        Pusat Chip
                    </span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-sm">
                        ROYAL
                    </span> <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 animate-shine bg-[length:200%_auto]">
                        DREAM
                    </span>
                </h1>

                {/* Subheading with Glass Badge */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-300">
                        <Gem className="text-emerald-400 w-5 h-5" />
                        <span className="text-gray-300 text-sm md:text-base tracking-wide">
                            Chip Termurah, Proses Kilat & <span className="text-amber-400 font-bold">Withdraw Pasti Cair</span>.
                        </span>
                    </div>
                </div>

                {/* 4. ACTIONS (Buttons) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-500">
                    {/* Primary Button */}
                    <a
                        href={games.length > 0 ? `/topup/${games[0].code}` : '#games'}
                        className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)] overflow-hidden border border-white/20"
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:animate-shine" />

                        <div className="relative flex items-center justify-center gap-3">
                            <span className="text-lg tracking-wider">BELI CHIP SEKARANG</span>
                            <div className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </a>

                    {/* Secondary Button */}
                    <a
                        href={config?.download_app?.royal_dream || '#'} target="_blank"
                        className="group relative w-full sm:w-auto px-10 py-5 bg-black/40 hover:bg-black/60 text-white font-bold rounded-2xl border border-white/10 hover:border-amber-500/50 transition-all hover:scale-105 active:scale-95 backdrop-blur-md flex items-center justify-center gap-3 shadow-xl"
                    >
                        <span>Download App</span>
                        <Zap className="w-5 h-5 text-amber-500 group-hover:animate-pulse" fill="currentColor" />
                    </a>
                </div>

                {/* 5. STATS GRID (Glass Cards) */}
                <div className="mt-32 max-w-4xl mx-auto">
                    <div className="grid grid-cols-3 gap-4 md:gap-8 p-4 md:p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                        {/* Decor */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                        <div className="group cursor-default text-center">
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-1 group-hover:text-emerald-400 transition-colors">1 Detik</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Proses Kilat</p>
                        </div>

                        <div className="group cursor-default text-center border-l border-r border-white/5">
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-1 group-hover:text-amber-400 transition-colors flex items-center justify-center gap-1">
                                Termurah
                                <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                            </h3>
                            <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Se-Indonesia</p>
                        </div>

                        <div className="group cursor-default text-center">
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">Pasti Bayar</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Withdraw Aman</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
