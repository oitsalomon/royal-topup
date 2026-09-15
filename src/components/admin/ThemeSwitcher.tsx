'use client'

import React, { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type ThemeMode = 'DARK' | 'LIGHT' | 'SYSTEM'

export default function ThemeSwitcher() {
    const [theme, setTheme] = useState<ThemeMode>('DARK')
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    const applyThemeToDOM = (selectedTheme: ThemeMode) => {
        const root = document.documentElement
        const isSystem = selectedTheme === 'SYSTEM'
        const systemPrefersLight = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
        const isLight = selectedTheme === 'LIGHT' || (isSystem && systemPrefersLight)

        if (isLight) {
            root.classList.add('light')
            root.setAttribute('data-theme', 'light')
        } else {
            root.classList.remove('light')
            root.setAttribute('data-theme', 'dark')
        }
    }

    useEffect(() => {
        setMounted(true)
        // Baca preferensi awal dari cookie / localStorage / user object
        try {
            const cookieMatch = document.cookie.match(/rc_admin_theme=([^;]+)/)
            const cookieTheme = cookieMatch ? (cookieMatch[1].toUpperCase() as ThemeMode) : null
            const userStr = localStorage.getItem('user')
            let dbTheme: ThemeMode | null = null
            if (userStr) {
                const u = JSON.parse(userStr)
                if (u.theme_preference) dbTheme = u.theme_preference.toUpperCase() as ThemeMode
            }

            const initial = dbTheme || cookieTheme || 'DARK'
            setTheme(initial)
            applyThemeToDOM(initial)
        } catch {}

        // Listen to system theme change if in SYSTEM mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
        const handleMediaChange = () => {
            const currentStored = localStorage.getItem('theme_preference') as ThemeMode
            if (currentStored === 'SYSTEM') {
                applyThemeToDOM('SYSTEM')
            }
        }
        mediaQuery.addEventListener('change', handleMediaChange)
        return () => mediaQuery.removeEventListener('change', handleMediaChange)
    }, [])

    const handleSelectTheme = async (newTheme: ThemeMode) => {
        setTheme(newTheme)
        setIsOpen(false)
        applyThemeToDOM(newTheme)

        try {
            localStorage.setItem('theme_preference', newTheme)
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const u = JSON.parse(userStr)
                u.theme_preference = newTheme
                localStorage.setItem('user', JSON.stringify(u))
            }
        } catch {}

        // Update cookie langsung di client
        document.cookie = `rc_admin_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`

        // Simpan ke database user
        try {
            await fetch('/api/admin/theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: newTheme })
            })
        } catch (e) {
            console.error('Failed to sync theme with server:', e)
        }
    }

    if (!mounted) {
        return (
            <div className="w-8 h-8 rounded-xl bg-[#1b1d22] border border-[#26282f] flex items-center justify-center text-[#7e8593]">
                <Moon size={15} strokeWidth={1.5} />
            </div>
        )
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                title={`Tema: ${theme === 'LIGHT' ? 'Terang' : theme === 'DARK' ? 'Gelap' : 'Ikut Sistem'}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--rc-panel2)] border border-[var(--rc-border)] text-[var(--rc-text2)] hover:text-[var(--rc-text)] hover:border-[var(--rc-accent)] transition-all cursor-pointer text-xs"
            >
                {theme === 'LIGHT' && <Sun size={15} strokeWidth={1.5} className="text-[#a8842f]" />}
                {theme === 'DARK' && <Moon size={15} strokeWidth={1.5} className="text-[#f5b301]" />}
                {theme === 'SYSTEM' && <Monitor size={15} strokeWidth={1.5} className="text-[#38bdf8]" />}
                <span className="hidden sm:inline font-semibold">
                    {theme === 'LIGHT' ? 'Terang' : theme === 'DARK' ? 'Gelap' : 'Sistem'}
                </span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-36 rounded-xl bg-[var(--rc-panel)] border border-[var(--rc-border)] shadow-xl p-1.5 z-50 space-y-1">
                        <button
                            type="button"
                            onClick={() => handleSelectTheme('LIGHT')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                                theme === 'LIGHT'
                                    ? 'bg-[var(--rc-accent)] text-[var(--rc-onaccent)] font-bold'
                                    : 'text-[var(--rc-text2)] hover:bg-[var(--rc-panel2)] hover:text-[var(--rc-text)]'
                            }`}
                        >
                            <Sun size={14} strokeWidth={1.5} />
                            <span>Terang</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectTheme('DARK')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                                theme === 'DARK'
                                    ? 'bg-[var(--rc-accent)] text-[var(--rc-onaccent)] font-bold'
                                    : 'text-[var(--rc-text2)] hover:bg-[var(--rc-panel2)] hover:text-[var(--rc-text)]'
                            }`}
                        >
                            <Moon size={14} strokeWidth={1.5} />
                            <span>Gelap</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectTheme('SYSTEM')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                                theme === 'SYSTEM'
                                    ? 'bg-[var(--rc-accent)] text-[var(--rc-onaccent)] font-bold'
                                    : 'text-[var(--rc-text2)] hover:bg-[var(--rc-panel2)] hover:text-[var(--rc-text)]'
                            }`}
                        >
                            <Monitor size={14} strokeWidth={1.5} />
                            <span>Ikut Sistem</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
