'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    id: number
    username: string
    level: string
    total_exp: number
    role: string
    gameIds?: any[]
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (userData: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: () => { },
    logout: () => { }
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const loadUser = async () => {
            try {
                const stored = localStorage.getItem('royal_member')
                if (stored) {
                    const parsedUser = JSON.parse(stored)
                    setUser(parsedUser)
                    setIsLoading(false) // Unblock UI immediately with cached data

                    // Fetch fresh data (Game IDs, Stats) in background
                    try {
                        const res = await fetch(`/api/members/me?id=${parsedUser.id}`)
                        if (res.ok) {
                            const data = await res.json()
                            // Merge fresh data
                            const updatedUser = {
                                ...parsedUser,
                                ...data.user, // level, etc
                                gameIds: data.gameIds // fresh game IDs
                            }
                            // Only update state if data actually changed to avoid re-renders? 
                            // For simplicity, just update. React handles ref consistency often.
                            setUser(updatedUser)
                            localStorage.setItem('royal_member', JSON.stringify(updatedUser))
                        } else if (res.status === 401 || res.status === 404) {
                            // Token invalid or user deleted
                            localStorage.removeItem('royal_member')
                            setUser(null)
                            router.push('/login')
                        }
                    } catch (err) {
                        console.error('Failed to refresh user data', err)
                    }
                } else {
                    // No stored user
                    setIsLoading(false)
                }
            } catch (e) {
                console.error('Failed to load user', e)
                localStorage.removeItem('royal_member')
                setIsLoading(false)
            }
        }
        loadUser()
    }, [])

    const login = (userData: User) => {
        setUser(userData)
        localStorage.setItem('royal_member', JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('royal_member')
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
