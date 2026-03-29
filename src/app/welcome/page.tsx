import Link from 'next/link';

export const metadata = {
    title: 'Clover Digital - Layanan Voucher Game Terpercaya',
    description: 'Pusat layanan voucher game digital dan kartu hadiah resmi. Proses cepat, aman, dan terpercaya 24 jam.',
    robots: {
        index: true,
        follow: true,
    },
};

export default function WelcomePage() {
    return (
        <div className="min-h-screen bg-v4-dark flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-md w-full text-center space-y-10 relative z-10">
                {/* Branding */}
                <div className="flex justify-center flex-col items-center animate-in fade-in slide-in-from-top-10 duration-1000">
                    <div className="w-24 h-24 v4-glass rounded-3xl flex items-center justify-center border border-purple-500/30 mb-6 shadow-2xl relative group">
                        <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <svg viewBox="0 0 24 24" className="w-14 h-14 text-purple-400 relative z-10 group-hover:scale-110 transition-transform duration-500" fill="currentColor">
                            <path d="M12,2C10.89,2 10,2.89 10,4C10,4.45 10.15,4.86 10.4,5.2L8,7.6L5.6,5.2C5.85,4.86 6,4.45 6,4C6,2.89 5.11,2 4,2C2.89,2 2,2.89 2,4C2,5.11 2.89,6 4,6C4.45,6 4.86,5.85 5.2,5.6L7.6,8L5.2,10.4C4.86,10.15 4.45,10 4,10C2.89,10 2,10.89 2,12C2,13.11 2.89,14 4,14C5.11,14 6,13.11 6,12C6,11.55 5.85,11.14 5.6,10.8L8,8.4L10.4,10.8C10.15,11.14 10,11.55 10,12C10,13.11 10.89,14 12,14C13.11,14 14,13.11 14,12C14,11.55 13.85,11.14 13.6,10.8L16,8.4L18.4,10.8C18.15,11.14 18,11.55 18,12C18,13.11 18.89,14 20,14C21.11,14 22,13.11 22,12C22,10.89 21.11,10 20,10C19.55,10 19.14,10.15 18.8,10.4L16.4,8L18.8,5.6C19.14,5.85 19.55,6 20,6C21.11,6 22,5.11 22,4C22,2.89 21.11,2 20,2C18.89,2 18,2.89 18,4C18,4.45 18.15,4.86 18.4,5.2L16,7.6L13.6,5.2C13.85,4.86 14,4.45 14,4C14,2.89 13.11,2 12,2Z" />
                        </svg>
                    </div>
                    <h1 className="v4-font-syne text-4xl font-extrabold tracking-tight text-white uppercase">ROYAL <span className="v4-text-gradient">CLOVER</span></h1>
                    <p className="text-[10px] font-black text-purple-400 mt-3 tracking-[0.5em] uppercase opacity-70">Premium Gaming Solutions</p>
                </div>

                {/* Content Card */}
                <div className="v4-glass rounded-[40px] p-10 space-y-8 shadow-2xl relative overflow-hidden group animate-in zoom-in fade-in duration-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="space-y-3 relative z-10">
                        <h2 className="v4-font-syne text-2xl font-black text-white uppercase tracking-tight">Selamat Datang</h2>
                        <p className="text-gray-500 font-medium text-xs leading-relaxed uppercase tracking-widest opacity-80">
                            Platform resmi sultan penyedia voucher digital dengan proses kilat 24 jam nonstop.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5 text-[9px] relative z-10">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group/feat">
                            <span className="block font-black text-cyan-400 mb-2 tracking-widest uppercase group-hover/feat:text-white transition-colors">Proses Kilat</span>
                            <span className="text-gray-600 font-bold uppercase tracking-widest">Otomatis 1 Detik</span>
                        </div>
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group/feat">
                            <span className="block font-black text-purple-400 mb-2 tracking-widest uppercase group-hover/feat:text-white transition-colors">Layanan 24/7</span>
                            <span className="text-gray-600 font-bold uppercase tracking-widest">Siap Melayani</span>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="v4-btn-main block w-full py-6 rounded-2xl text-white font-black text-[12px] tracking-[0.3em] uppercase transition-all shadow-2xl relative z-10"
                    >
                        MULAI PETUALANGAN
                    </Link>
                </div>

                {/* Trust Indicators */}
                <div className="pt-4 flex justify-center items-center gap-8 text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500">
                    <span className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                        Resmi
                    </span>
                    <span className="flex items-center gap-2 hover:text-purple-400 transition-colors cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                        Aman
                    </span>
                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                        Trust
                    </span>
                </div>
            </div>
        </div>
    );
}
