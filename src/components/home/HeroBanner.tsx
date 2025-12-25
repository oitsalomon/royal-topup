'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react'

export default function HeroBanner() {
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(console.error)
    }, [])

    return (
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[#050912]">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-float" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-20" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md animate-float hover:bg-white/10 transition-colors cursor-default">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 tracking-[0.2em] uppercase">Official Partner Resmi</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                    TOP UP <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 animate-shimmer bg-[length:200%_auto]">
                        CLOVER SULTAN
                    </span>
                </h1>

                {/* Subheading */}
                <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
                    Nikmati layanan Top Up <span className="text-amber-400 font-bold">Premium & Eksklusif</span>.
                    Proses 1 detik, aman, dan terpercaya sejak 2024.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href="#games"
                        className="group relative w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#050912] font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
                        <div className="relative flex items-center justify-center gap-2">
                            <span>MULAI TRANSAKSI</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </a>

                    <a
                        href={config?.download_app?.royal_dream || '#'} target="_blank"
                        className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm flex items-center justify-center gap-2"
                    >
                        <span>Download App</span>
                    </a>
                </div>

                {/* Floating Elements (Decorative) */}
                <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-0 animate-float" style={{ animationDelay: '1s' }}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-white/10 backdrop-blur-md flex items-center justify-center transform rotate-12">
                        <Zap className="text-emerald-400" size={32} />
                    </div>
                </div>
                <div className="hidden lg:block absolute top-1/3 right-10 animate-float" style={{ animationDelay: '2s' }}>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-white/10 backdrop-blur-md flex items-center justify-center transform -rotate-12">
                        <Star className="text-amber-400 decoration-slice" size={32} fill="currentColor" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="mt-24 grid grid-cols-3 gap-4 md:gap-12 border-t border-white/5 pt-12 max-w-4xl mx-auto">
                    <div className="group cursor-default">
                        <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <Zap className="text-emerald-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-white">1 Detik</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Proses Kilat</p>
                    </div>
                    <div className="group cursor-default">
                        <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Star className="text-amber-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-white">VIP</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Layanan Sultan</p>
                    </div>
                    <div className="group cursor-default">
                        <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <ShieldCheck className="text-blue-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-white">100%</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Aman & Legal</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
