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

                    // Fetch fresh data (Game IDs, Stats)
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
                            setUser(updatedUser)
                            localStorage.setItem('royal_member', JSON.stringify(updatedUser))
                        }
                    } catch (err) {
                        console.error('Failed to refresh user data', err)
                    }
                }
            } catch (e) {
                console.error('Failed to load user', e)
                localStorage.removeItem('royal_member')
            } finally {
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
