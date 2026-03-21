'use client'

import { useState, useEffect } from 'react'

export default function LiveTicker() {
    // Generate fake entries
    const [activities, setActivities] = useState<{ id: number; text: React.ReactNode; time: string; type: string }[]>([])

    const types = ['TOPUP', 'BONGKAR', 'ORDER']
    const names = ['Agus', 'Wahyu', 'Rini', 'Budi', 'Joko', 'Siti', 'Yanto', 'Dewi', 'Putra', 'Rizky', '0812****', '0852****', '0813****']
    const amountsTopup = ['1B', '2B', '5B', '10B', '20B', '50B', '100B', '200B']
    const amountsBongkar = ['50B', '100B', '200B', '500B', '1T', '2T', '5T']
    
    // Create random activity
    const createRandomActivity = () => {
        const type = types[Math.floor(Math.random() * types.length)]
        const name = names[Math.floor(Math.random() * names.length)]
        
        const isBongkar = type === 'BONGKAR'
        const amountArr = isBongkar ? amountsBongkar : amountsTopup
        const amount = amountArr[Math.floor(Math.random() * amountArr.length)]
        
        let text
        if (type === 'TOPUP') {
            text = <span key={1}><strong className="text-white">{name}</strong> baru saja order <span className="text-emerald-400 font-bold">{amount} Emas</span></span>
        } else if (type === 'BONGKAR') {
            text = <span key={2}><strong className="text-white">{name}</strong> berhasil bongkar <span className="text-red-400 font-bold">{amount} Chip</span></span>
        } else {
            text = <span key={3}><strong className="text-white">{name}</strong> pesanan sukses <span className="text-yellow-400 font-bold">{amount} MD</span></span>
        }

        return {
            id: Date.now() + Math.random(),
            text,
            time: 'Baru saja',
            type
        }
    }

    // Initial load
    useEffect(() => {
        const initial = Array.from({ length: 6 }).map(() => createRandomActivity())
        setActivities(initial)

        // Add new item every 3-6 seconds
        const intervalId = setInterval(() => {
            setActivities(prev => {
                const newArr = [createRandomActivity(), ...prev]
                if (newArr.length > 10) newArr.pop() // keep max 10
                return newArr
            })
        }, Math.floor(Math.random() * 3000) + 3000)

        return () => clearInterval(intervalId)
    }, [])

    return (
        <div className="relative w-full overflow-hidden bg-[#0f172a] border-y border-white/5 py-4">
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0f172a] to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0f172a] to-transparent z-10"></div>
            
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
                {activities.map((act) => (
                    <div key={act.id} className="inline-flex items-center gap-2 bg-[#1e293b]/60 px-4 py-2 rounded-full border border-white/5">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${act.type === 'BONGKAR' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-sm text-gray-300 font-medium">
                            {act.text}
                        </span>
                    </div>
                ))}
                {/* Duplicate for infinite scrolling effect */}
                {activities.map((act) => (
                    <div key={`dup-${act.id}`} className="inline-flex items-center gap-2 bg-[#1e293b]/60 px-4 py-2 rounded-full border border-white/5">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${act.type === 'BONGKAR' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-sm text-gray-300 font-medium">
                            {act.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
