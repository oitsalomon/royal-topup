'use client'
import { ArrowRight, Zap, Star, Sparkles, Gem, Quote, Gift } from 'lucide-react'
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
        <div className="bg-black text-white font-montserrat min-h-screen">
            {/* HERO SECTION */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-24">
                {/* Background FX */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black to-black" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    
                    {/* Logo */}
                    <div className="relative inline-block mb-10 group animate-in zoom-in duration-1000">
                        <div className="absolute inset-0 bg-amber-500/20 blur-[50px] rounded-full group-hover:bg-amber-500/30 transition-all duration-700" />
                        <Image
                            src="/images/clover-logo.png"
                            alt="Clover Store Logo"
                            width={160}
                            height={160}
                            priority
                            className="w-28 h-28 md:w-40 md:h-40 relative z-10 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] transform group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute -top-2 -right-2 animate-bounce delay-100">
                            <Sparkles className="text-amber-400 w-6 h-6 drop-shadow-lg" fill="currentColor" />
                        </div>
                    </div>

                    {/* Tagline */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-amber-500/20 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-200">
                            <Gem className="text-amber-400 w-4 h-4" />
                            <span className="text-gray-300 text-sm tracking-widest font-medium uppercase">
                                Pusat Chip Royal Dream - Termurah, Tercepat, Terpercaya
                            </span>
                        </div>
                    </div>

                    {/* Typography */}
                    <h1 className="font-cormorant text-6xl md:text-8xl lg:text-9xl tracking-tight text-white mb-8 leading-[1]">
                        <span className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            Premium
                        </span>
                        <br />
                        <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 italic pr-4">
                            Gaming
                        </span>
                        <span className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            Experience.
                        </span>
                    </h1>

                    {/* Static Referral Promo */}
                    {!user && (
                        <div className="flex justify-center mb-10 animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-300">
                            <Link href="/register" className="group relative overflow-hidden rounded-xl bg-amber-950/30 border border-amber-500/20 px-6 py-3 transition-all hover:bg-amber-900/40 hover:border-amber-500/50 hover:scale-105 active:scale-95">
                                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center">
                                    <span className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                                        <Gift className="w-4 h-4 text-amber-500" />
                                        Undang Teman = Cuan!
                                    </span>
                                    <span className="hidden md:block w-px h-4 bg-white/10"></span>
                                    <span className="text-gray-300 text-xs">
                                        Dapatkan Bonus <span className="text-amber-400 font-bold">Rp 750 / 1B Chip</span> Seumur Hidup!
                                    </span>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-400">
                        <a
                            href={games.length > 0 ? `/topup/${games[0].code}` : '#games'}
                            className="group relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold uppercase tracking-widest text-sm rounded-none border border-amber-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-200%] group-hover:animate-shine" />
                            <div className="relative flex items-center justify-center gap-3">
                                <span>Beli Chip Sekarang</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        <a
                            href={config?.download_app?.royal_dream || '#'} target="_blank"
                            className="group relative w-full sm:w-auto px-10 py-4 bg-transparent text-white font-bold uppercase tracking-widest text-sm rounded-none border border-white/20 hover:border-amber-400 transition-all hover:scale-105 active:scale-95 backdrop-blur-md flex items-center justify-center gap-3"
                        >
                            <span>Download App</span>
                            <Zap className="w-4 h-4 text-amber-500 group-hover:animate-pulse" fill="currentColor" />
                        </a>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section className="relative py-24 bg-[#050505] border-t border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="font-cormorant text-4xl md:text-6xl text-amber-400 mb-4">Harga Spesial Sultan</h2>
                        <p className="text-gray-400 uppercase tracking-widest text-sm">Semakin Banyak Beli, Semakin Murah!</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { tier: 'Mulai Dari 1B', range: '1-9B', price: 'Rp 65.000', label: 'Silver', popular: false },
                            { tier: 'Grosir', range: '10-19B', price: 'Rp 64.500', label: 'Gold', popular: false },
                            { tier: 'Partai Besar', range: '20-49B', price: 'Rp 64.000', label: 'Platinum', popular: true },
                            { tier: 'Raja Sultan', range: '50B+', price: 'Rp 63.000', label: 'Diamond', popular: false }
                        ].map((pkg, idx) => (
                            <div key={idx} className={`relative p-8 border ${pkg.popular ? 'border-amber-400 bg-amber-950/20 translate-y-[-10px]' : 'border-white/10 bg-black/40'} flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-amber-500/50 hover:bg-neutral-900 group backdrop-blur-sm`}>
                                {pkg.popular && (
                                    <div className="absolute -top-3 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-bold uppercase tracking-widest rotate-2">
                                        Disarankan
                                    </div>
                                )}
                                <p className="text-amber-500/80 font-bold tracking-widest text-xs uppercase mb-2">{pkg.label}</p>
                                <h3 className="font-cormorant text-3xl text-white mb-2">{pkg.range}</h3>
                                <p className="text-gray-500 text-sm mb-6">{pkg.tier}</p>
                                <div className="text-2xl font-bold text-amber-400 bg-clip-text tracking-wider">{pkg.price}<span className="text-sm text-gray-500 font-normal"> / 1B</span></div>
                                <div className="mt-8 w-12 h-[1px] bg-amber-500/30 group-hover:w-full group-hover:bg-amber-500/50 transition-all duration-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section className="py-24 bg-black relative border-t border-white/5">
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="font-cormorant text-4xl md:text-6xl text-white mb-4">Apa Kata <span className="text-amber-400 italic">Sultan?</span></h2>
                        <p className="text-gray-400 uppercase tracking-widest text-sm gap-2 flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                            <span>Terpercaya Gak Pake Lama</span>
                            <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Andi R.", role: "Pemain Professional", review: "Proses cepat banget, gak sampai 1 detik chip udah masuk. Harga juga paling murah meriah dibanding lapak sebelah. Mantap bang!" },
                            { name: "Budi S.", role: "Sultan Harian", review: "Withdraw-nya aman, bener-bener gak ribet. Admin responsif dan CS sangat ramah. Bakal langganan terus di sini." },
                            { name: "Chandra K.", role: "Partai Besar", review: "Udah sering order partai 50B+, selalu aman dan hitungan detik beres. Harga khusus sultan memang the best banget Clover Store!" }
                        ].map((t, i) => (
                            <div key={i} className="p-8 border border-white/10 bg-neutral-900/40 relative group hover:border-amber-500/30 transition-colors">
                                <Quote className="w-10 h-10 text-amber-500/20 absolute top-6 right-6 group-hover:text-amber-500/40 transition-colors" />
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 text-amber-500" fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-8 italic">"{t.review}"</p>
                                <div>
                                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">{t.name}</h4>
                                    <p className="text-amber-500/70 text-xs mt-1 uppercase tracking-widest">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
