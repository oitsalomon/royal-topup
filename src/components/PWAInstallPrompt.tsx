'use client'

import { useState, useEffect } from 'react'
import { X, Smartphone, Download, Share } from 'lucide-react'

export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Handle Android/Chrome Install Prompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setInstallPrompt(e)
            
            // Show prompt after a delay (e.g., 5 seconds) so it's not too intrusive
            const timer = setTimeout(() => {
                const dismissed = localStorage.getItem('pwa-prompt-dismissed')
                if (!dismissed) {
                    setIsVisible(true)
                }
            }, 5000)
            
            return () => clearTimeout(timer)
        }

        // Handle iOS specific detection
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        const isStandalone = (window as any).navigator.standalone || window.matchMedia('(display-mode: standalone)').matches

        if (isIOSDevice && !isStandalone) {
            setIsIOS(true)
            const timer = setTimeout(() => {
                const dismissed = localStorage.getItem('pwa-prompt-dismissed')
                if (!dismissed) {
                    setIsVisible(true)
                }
            }, 5000)
            return () => clearTimeout(timer)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstall = async () => {
        if (!installPrompt) return

        installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice
        
        if (outcome === 'accepted') {
            setInstallPrompt(null)
            setIsVisible(false)
        }
    }

    const dismissPrompt = () => {
        setIsVisible(false)
        // Don't show again for 7 days
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[9999] md:left-auto md:right-8 md:w-[400px] animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="v4-glass p-6 rounded-[32px] border border-white/10 shadow-2xl shadow-purple-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <button 
                    onClick={dismissPrompt}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
                >
                    <X size={20} />
                </button>

                <div className="flex gap-5 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
                        <Smartphone size={28} />
                    </div>

                    <div className="flex-1">
                        <h3 className="v4-font-syne text-lg font-bold text-white mb-1 uppercase tracking-tight">Clover App</h3>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed">
                            {isIOS 
                                ? 'Klik tombol bagi (share) dan pilih "Tambah ke Layar Utama" untuk akses cepat.' 
                                : 'Instal Clover Store di HP Anda untuk transaksi 1 detik lebih gampang!'}
                        </p>
                    </div>
                </div>

                {!isIOS && (
                    <button 
                        onClick={handleInstall}
                        className="mt-6 w-full py-4 v4-btn-main rounded-2xl flex items-center justify-center gap-2 font-black text-xs text-white uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        <Download size={16} />
                        Pasang Aplikasi
                    </button>
                )}

                {isIOS && (
                    <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-cyan-400">
                        <Share size={16} className="shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Gunakan menu Safari untuk Instal</span>
                    </div>
                )}
            </div>
        </div>
    )
}
