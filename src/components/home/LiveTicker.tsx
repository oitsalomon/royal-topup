'use client'

import { useState, useEffect } from 'react'

export default function LiveTicker() {
    const [currentActivity, setCurrentActivity] = useState<{ id: number; text: React.ReactNode; type: string } | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    const types = ['TOPUP', 'BONGKAR', 'ORDER']
    const [realActivities, setRealActivities] = useState<any[]>([])
    
    // Root names and prefixes for infinite generation
    const nameRoots = ['Agus', 'Wahyu', 'Rini', 'Budi', 'Joko', 'Siti', 'Yanto', 'Dewi', 'Putra', 'Rizky', 'Hendra', 'Sari', 'Ayu', 'Dimas', 'Eko', 'Fitri', 'Gilang', 'Intan']
    const prefixes = ['0812', '0813', '0852', '0853', '0821', '0822', '0896', '0895', '0819']
    
    const amountsTopup = ['1B', '2B', '5B', '10B', '20B', '30B', '40B', '50B', '100B', '200B']
    const bongkarMultiplier = 60000 
    const bongkarAmountsB = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50] 
    
    // Generate a completely random identity so it never looks suspicious
    const generateIdentity = () => {
        const usePhoneNumber = Math.random() > 0.5
        if (usePhoneNumber) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
            const suffix = Math.floor(Math.random() * 900) + 100 // 3 random digits
            return `${prefix}****${suffix}`
        } else {
            const root = nameRoots[Math.floor(Math.random() * nameRoots.length)]
            const suffixChars = 'abcdefghijklmnopqrstuvwxyz0123456789'
            const randomSuffix = Array.from({ length: 2 }).map(() => suffixChars[Math.floor(Math.random() * suffixChars.length)]).join('')
            return `${root}_${randomSuffix}**`
        }
    }

    const createRandomActivity = () => {
        // 40% chance to show a real transaction if we have them
        if (realActivities.length > 0 && Math.random() < 0.4) {
            const real = realActivities[Math.floor(Math.random() * realActivities.length)]
            let text
            if (real.type === 'TOPUP') {
                text = <span key={`r1-${real.id}`}><strong className="text-white">{real.name}</strong> baru saja order <span className="text-emerald-400 font-bold">{real.amountStr}</span></span>
            } else {
                text = <span key={`r2-${real.id}`}><strong className="text-white">{real.name}</strong> berhasil tarik dana <span className="text-red-400 font-bold">{real.amountStr}</span></span>
            }
            return {
                id: Date.now() + Math.random(),
                text,
                type: real.type
            }
        }

        // Otherwise generate fake
        const type = types[Math.floor(Math.random() * types.length)]
        const name = generateIdentity()
        
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

    useEffect(() => {
        // Fetch real transactions once on mount
        fetch('/api/public/recent-transactions')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRealActivities(data)
                }
            })
            .catch(err => console.error("Failed to fetch recent real transactions", err))

        const showNext = () => {
            setCurrentActivity(createRandomActivity())
            setIsVisible(true)
            
            // Hide after 4 seconds
            setTimeout(() => {
                setIsVisible(false)
            }, 4000)
        }

        // Initial delay
        const initialTimeout = setTimeout(showNext, 2000)
        // Repeat every 7 seconds (4s visible + 3s hidden)
        const intervalId = setInterval(showNext, 7000)

        return () => {
            clearTimeout(initialTimeout)
            clearInterval(intervalId)
        }
    }, [])

    return (
        <div className={`fixed bottom-6 left-6 z-50 transition-all duration-500 pointer-events-none ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
            {currentActivity && (
                <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] px-5 py-3.5 rounded-2xl flex items-center gap-4 max-w-[320px]">
                    <div className="relative shrink-0 flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full ${currentActivity.type === 'BONGKAR' ? 'bg-red-500' : 'bg-emerald-500'} animate-ping absolute opacity-60`}></div>
                        <div className={`w-2.5 h-2.5 rounded-full ${currentActivity.type === 'BONGKAR' ? 'bg-red-500' : 'bg-emerald-500'} relative z-10 box-content border-2 border-[#0f172a]`}></div>
                    </div>
                    <span className="text-[13px] leading-snug font-medium text-gray-200">
                        {currentActivity.text}
                    </span>
                </div>
            )}
        </div>
    )
}
