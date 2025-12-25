'use client'
import { useState, useEffect } from 'react'

export default function HeroBanner() {
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(console.error)
    }, [])
    return (
        <div className="relative pt-40 pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm animate-float">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-300 tracking-wide uppercase">System Online • Proses 1 Detik</span>
                </div>

                <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-8 leading-normal">
                    Top Up Game <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-500 animate-glow">
                        Sultan Reborn
                    </span>
                </h1>

                <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Platform Top Up termurah, tercepat, dan terpercaya.
                    <br />
                    Rasakan sensasi transaksi <span className="text-emerald-400 font-bold">VIP & Elite</span>.
                </p>

                <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-6">
                    <a href="#games" className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold overflow-hidden shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/50 transition-all transform hover:-translate-y-1 w-full md:w-auto text-center">
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12 -translate-x-full" />
                        <span className="relative">Mulai Transaksi</span>
                    </a>

                    {/* Direct Contact Options */}
                    <div className="flex items-center gap-3">
                        <a href={config?.contacts?.whatsapp?.number ? `https://wa.me/${config.contacts.whatsapp.number.replace(/[^0-9]/g, '')}` : '#'} target="_blank" className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white transition-all hover:scale-110" title="WhatsApp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        </a>
                        <a href={config?.contacts?.telegram?.username ? `https://t.me/${config.contacts.telegram.username.replace('https://t.me/', '').replace('@', '')}` : '#'} target="_blank" className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all hover:scale-110" title="Telegram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        </a>
                        <a href={config?.contacts?.live_chat?.url || '#'} target="_blank" className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-white transition-all hover:scale-110" title="Live Chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </a>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-10">
                    <div>
                        <div className="text-3xl font-bold text-white">24/7</div>
                        <div className="text-sm text-gray-500 mt-1">Layanan Non-Stop</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">1 Detik</div>
                        <div className="text-sm text-gray-500 mt-1">Proses Otomatis</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">100%</div>
                        <div className="text-sm text-gray-500 mt-1">Garansi Sultan</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">Elite</div>
                        <div className="text-sm text-gray-500 mt-1">Quality Service</div>
                    </div>
                </div>
            </div>
        </div >
    )
}
