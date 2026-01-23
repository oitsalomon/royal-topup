'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function FloatingChat() {
    const [isVisible, setIsVisible] = useState(true)
    const [whatsappNumber, setWhatsappNumber] = useState('6281234567890') // Default

    const pathname = usePathname()

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data?.contacts?.whatsapp?.number) {
                    setWhatsappNumber(data.contacts.whatsapp.number)
                }
            })
            .catch(err => console.error(err))
    }, [])

    if (pathname.startsWith('/admin')) return null
    if (!isVisible) return null

    const handleChat = () => {
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
        window.open(`https://wa.me/${cleanNumber}`, '_blank')
    }

    return (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500 flex flex-col items-end gap-2 max-w-[200px]">
            {/* Chat Bubble */}
            <div className="bg-white text-gray-900 p-3 rounded-2xl rounded-br-none shadow-xl border border-gray-200 relative animate-bounce-slow">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1 text-gray-500 hover:bg-gray-300"
                >
                    <X size={10} />
                </button>
                <p className="text-xs font-medium leading-relaxed text-right">
                    Ada yang bisa dibantu? Silakan klik ini 👇
                </p>
            </div>

            {/* WhatsApp Button */}
            <button
                onClick={handleChat}
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-3 rounded-full shadow-lg shadow-green-500/30 transition-transform hover:scale-110 flex items-center justify-center group"
            >
                <MessageCircle size={28} fill="currentColor" className="text-white" />
            </button>
        </div>
    )
}
