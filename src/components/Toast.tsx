'use client'

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: number
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export const useToast = () => useContext(ToastContext)

let toastCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++toastCounter
        setToasts(prev => [...prev.slice(-3), { id, message, type }]) // max 4 toasts
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
    const colorMap = {
        success: 'bg-emerald-500/90 border-emerald-400/30',
        error: 'bg-red-500/90 border-red-400/30',
        warning: 'bg-amber-500/90 border-amber-400/30',
        info: 'bg-blue-500/90 border-blue-400/30',
    }
    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    }

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl text-white text-sm font-bold min-w-[200px] max-w-[320px] animate-in slide-in-from-right-5 fade-in duration-300 cursor-pointer ${colorMap[toast.type]}`}
            onClick={() => onDismiss(toast.id)}
            role="alert"
        >
            <span className="text-base leading-none">{iconMap[toast.type]}</span>
            <span className="flex-1 text-sm font-semibold">{toast.message}</span>
        </div>
    )
}
