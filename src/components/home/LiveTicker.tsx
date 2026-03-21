'use client'

import { useState, useEffect } from 'react'

export default function LiveTicker() {
    // Generate fake entries
    const [currentActivity, setCurrentActivity] = useState<{ id: number; text: React.ReactNode; type: string } | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    const types = ['TOPUP', 'BONGKAR', 'ORDER']
    const names = ['Agus_**', 'Wahyu_**', 'Rini_**', 'Budi_**', 'Joko_**', 'Siti_**', 'Yanto_**', 'Dewi_**', 'Putra_**', 'Rizky_**', '0812****', '0852****', '0813****']
    const amountsTopup = ['1B', '2B', '5B', '10B', '20B', '50B', '100B', '200B']
    const bongkarMultiplier = 60000 // 1B = Rp 60.000
    const bongkarAmountsB = [1, 2, 3, 5, 10, 15, 20, 40, 50] // Max 50B (Rp 3.000.000) so it stays realistic
    
    // Create random activity
    const createRandomActivity = () => {
        const type = types[Math.floor(Math.random() * types.length)]
        const name = names[Math.floor(Math.random() * names.length)]
        
        const isBongkar = type === 'BONGKAR'
        
        let text
        if (type === 'TOPUP' || type === 'ORDER') {
            const amount = amountsTopup[Math.floor(Math.random() * amountsTopup.length)]
            text = <span key={1}><strong className="text-white">{name}</strong> baru saja order <span className="text-emerald-400 font-bold">{amount}</span></span>
        } else {
            const amountB = bongkarAmountsB[Math.floor(Math.random() * bongkarAmountsB.length)]
            const totalRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amountB * bongkarMultiplier)
            text = <span key={2}><strong className="text-white">{name}</strong> berhasil tarik dana <span className="text-red-400 font-bold">{totalRupiah}</span></span>
        }

        return {
            id: Date.now() + Math.random(),
            text,
            type
        }
    }

    // Interval to cycle notifications
    useEffect(() => {
        const showNext = () => {
            setCurrentActivity(createRandomActivity())
            setIsVisible(true)
            
            // Hide after 3.5 seconds
            setTimeout(() => {
                setIsVisible(false)
            }, 3500)
        }

        // Initial delay
        const initialTimeout = setTimeout(showNext, 2000)

        // Then repeat every 6 seconds
        const intervalId = setInterval(showNext, 6000)

        return () => {
            clearTimeout(initialTimeout)
            clearInterval(intervalId)
        }
    }, [])

    return (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 pointer-events-none ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}>
            {currentActivity && (
                <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 shadow-2xl px-6 py-3 rounded-2xl flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${currentActivity.type === 'BONGKAR' ? 'bg-red-500' : 'bg-emerald-500'} animate-ping absolute opacity-50`}></div>
                        <div className={`w-3 h-3 rounded-full ${currentActivity.type === 'BONGKAR' ? 'bg-red-500' : 'bg-emerald-500'} relative z-10`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-200">
                        {currentActivity.text}
                    </span>
                </div>
            )}
        </div>
    )
}
