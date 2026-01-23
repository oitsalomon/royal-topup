'use client'

import { AlertCircle, CheckCircle, X } from 'lucide-react'

interface AlertModalProps {
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info'
    onClose: () => void
    onConfirm?: () => void
    confirmText?: string
}

export default function AlertModal({ isOpen, title, message, type, onClose, onConfirm, confirmText = 'OK' }: AlertModalProps) {
    if (!isOpen) return null

    // Styles based on type
    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle className="w-12 h-12 text-green-500 mb-4" />,
                    button: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/25',
                    border: 'border-green-500/20',
                    bg: 'bg-green-500/5'
                }
            case 'error':
                return {
                    icon: <AlertCircle className="w-12 h-12 text-red-500 mb-4" />,
                    button: 'bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-red-500/25',
                    border: 'border-red-500/20',
                    bg: 'bg-red-500/5'
                }
            default:
                return {
                    icon: <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />,
                    button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/25',
                    border: 'border-blue-500/20',
                    bg: 'bg-blue-500/5'
                }
        }
    }

    const style = getStyles()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-sm transform overflow-hidden rounded-3xl border ${style.border} bg-[#0a0a0a]/90 p-8 text-center shadow-2xl transition-all animate-in zoom-in-95 duration-200`}>
                <div className={`absolute inset-0 ${style.bg} pointer-events-none`} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-white/10 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="relative z-10 flex flex-col items-center">
                    {style.icon}

                    <h3 className="text-xl font-bold text-white mb-2 tracking-wide font-outfit">
                        {title}
                    </h3>

                    <p className="text-gray-300 text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <button
                        onClick={() => {
                            if (onConfirm) onConfirm()
                            onClose()
                        }}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 ${style.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
