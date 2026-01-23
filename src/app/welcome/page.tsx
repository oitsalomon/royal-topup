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
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Simple Branding */}
                <div className="flex justify-center flex-col items-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/30 mb-4">
                        <svg viewBox="0 0 24 24" className="w-12 h-12 text-green-500" fill="currentColor">
                            <path d="M12,2C10.89,2 10,2.89 10,4C10,4.45 10.15,4.86 10.4,5.2L8,7.6L5.6,5.2C5.85,4.86 6,4.45 6,4C6,2.89 5.11,2 4,2C2.89,2 2,2.89 2,4C2,5.11 2.89,6 4,6C4.45,6 4.86,5.85 5.2,5.6L7.6,8L5.2,10.4C4.86,10.15 4.45,10 4,10C2.89,10 2,10.89 2,12C2,13.11 2.89,14 4,14C5.11,14 6,13.11 6,12C6,11.55 5.85,11.14 5.6,10.8L8,8.4L10.4,10.8C10.15,11.14 10,11.55 10,12C10,13.11 10.89,14 12,14C13.11,14 14,13.11 14,12C14,11.55 13.85,11.14 13.6,10.8L16,8.4L18.4,10.8C18.15,11.14 18,11.55 18,12C18,13.11 18.89,14 20,14C21.11,14 22,13.11 22,12C22,10.89 21.11,10 20,10C19.55,10 19.14,10.15 18.8,10.4L16.4,8L18.8,5.6C19.14,5.85 19.55,6 20,6C21.11,6 22,5.11 22,4C22,2.89 21.11,2 20,2C18.89,2 18,2.89 18,4C18,4.45 18.15,4.86 18.4,5.2L16,7.6L13.6,5.2C13.85,4.86 14,4.45 14,4C14,2.89 13.11,2 12,2Z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-green-400">CLOVER DIGITAL</h1>
                    <p className="text-gray-400 mt-2">Premium Gaming Services</p>
                </div>

                {/* Safe Marketing Content */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-sm">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Selamat Datang</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Platform resmi penyedia voucher digital dan layanan hiburan game dengan proses instan 24 jam nonstop.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="block font-bold text-green-400 mb-1">PROSES KILAT</span>
                            <span className="text-gray-500">Otomatis 1 Detik</span>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="block font-bold text-green-400 mb-1">LAYANAN 24/7</span>
                            <span className="text-gray-500">Siap Melayani Anda</span>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="block w-full py-4 px-6 bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] transform hover:scale-[1.02]"
                    >
                        MULAI BELANJA SEKARANG
                    </Link>
                </div>

                {/* Trust Indicators */}
                <div className="pt-4 flex justify-center items-center gap-6 text-[10px] text-gray-500 font-medium uppercase tracking-[2px]">
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        Resmi
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        Aman
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        Terpercaya
                    </span>
                </div>
            </div>
        </div>
    );
}
