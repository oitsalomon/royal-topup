export default function HeroBanner() {
    return (
        <div className="relative pt-40 pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm animate-float">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-cyan-300 tracking-wide uppercase">System Online • Proses 1 Detik</span>
                </div>

                <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-8 leading-normal">
                    Top Up Game <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-glow">
                        Level Sultan
                    </span>
                </h1>

                <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Platform Top Up termurah, tercepat, dan terpercaya di Indonesia.
                    <br />
                    Nikmati pengalaman transaksi <span className="text-white font-bold">Premium</span> tanpa ribet.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                    <a href="#games" className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold overflow-hidden shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 transition-all transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12 -translate-x-full" />
                        <span className="relative">Mulai Transaksi Sekarang</span>
                    </a>

                    <a href="https://wa.me/6281234567890" target="_blank" className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                        <span>Hubungi CS</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </a>
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
                        <div className="text-sm text-gray-500 mt-1">Garansi Uang Kembali</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">10k+</div>
                        <div className="text-sm text-gray-500 mt-1">Transaksi Harian</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
