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
                    icon: <CheckCircle className="w-16 h-16 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />,
                    button: 'v4-btn-main',
                    border: 'border-cyan-500/30',
                    bg: 'bg-cyan-500/5',
                    glow: 'bg-cyan-500/10'
                }
            case 'error':
                return {
                    icon: <AlertCircle className="w-16 h-16 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />,
                    button: 'bg-gradient-to-r from-red-600 to-pink-600 shadow-lg shadow-red-500/20',
                    border: 'border-red-500/30',
                    bg: 'bg-red-500/5',
                    glow: 'bg-red-500/10'
                }
            default:
                return {
                    icon: <AlertCircle className="w-16 h-16 text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />,
                    button: 'v4-btn-main bg-gradient-to-r from-purple-600 to-blue-600',
                    border: 'border-purple-500/30',
                    bg: 'bg-purple-500/5',
                    glow: 'bg-purple-500/10'
                }
        }
    }

    const style = getStyles()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#050912]/90 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-sm v4-glass rounded-[40px] border ${style.border} p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all animate-in zoom-in-95 duration-500 overflow-hidden group`}>
                {/* Background Glow */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 ${style.glow} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
                <div className={`absolute -bottom-10 -left-10 w-40 h-40 ${style.glow} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 rounded-2xl p-2.5 text-gray-500 hover:bg-white/10 hover:text-white transition-all z-20 border border-white/5"
                >
                    <X size={18} />
                </button>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="animate-in slide-in-from-top-4 duration-700">
                        {style.icon}
                    </div>

                    <h3 className="v4-font-syne text-2xl font-black text-white mb-3 tracking-tight uppercase">
                        {title}
                    </h3>

                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10 opacity-70">
                        {message}
                    </p>

                    <button
                        onClick={() => {
                            if (onConfirm) onConfirm()
                            onClose()
                        }}
                        className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase text-white shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 ${style.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
