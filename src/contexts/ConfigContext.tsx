'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ConfigContextType {
    config: any | null
    isLoading: boolean
}

const ConfigContext = createContext<ConfigContextType>({
    config: null,
    isLoading: true,
})

export const useConfig = () => useContext(ConfigContext)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/config', { next: { revalidate: 60 } } as RequestInit)
            .then(res => res.json())
            .then(data => {
                setConfig(data)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to load config:', err)
                setIsLoading(false)
            })
    }, [])

    return (
        <ConfigContext.Provider value={{ config, isLoading }}>
            {children}
        </ConfigContext.Provider>
    )
}
