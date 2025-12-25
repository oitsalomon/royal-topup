'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface Game {
    id: number
    name: string
    code: string
    image: string | null
    isActive: boolean
    externalUrl: string | null
}

export default function GameGrid() {
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/games')
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text()
                    throw new Error(`Failed to fetch games: ${res.status} ${text}`)
                }
                return res.json()
            })
            .then((data) => {
                // Filter active games
                if (Array.isArray(data)) {
                    const activeGames = data.filter((g: Game) => g.isActive)
                    setGames(activeGames)
                } else {
                    console.error('API response is not an array:', data)
                    setGames([])
                }
                setLoading(false)
            })
            .catch((err) => {
                console.error('Error loading games:', err)
                setLoading(false)
            })
    }, [])

    return (
        <section id="games" className="py-20 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Pilih Game</h2>
                        <p className="text-gray-400 mt-2">Silakan pilih game favoritmu untuk Top Up</p>
                    </div>
                    <div className="hidden sm:block">
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400">
                            Total {games.length} Games Tersedia
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {games.map((game) => {
                            const isExternal = !!game.externalUrl
                            const href = isExternal ? game.externalUrl! : `/topup/${game.code.toLowerCase().replace('_', '-')}`

                            return (
                                <Link
                                    key={game.id}
                                    href={href}
                                    target={isExternal ? "_blank" : undefined}
                                    rel={isExternal ? "noopener noreferrer" : undefined}
                                    className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] hover:-translate-y-2"
                                >
                                    <div className="aspect-[3/4] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />

                                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-gray-600">
                                            {game.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                                    <span className="text-4xl font-bold opacity-20">{game.code.substring(0, 2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Overlay Button */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-black/40 backdrop-blur-[2px]">
                                            <div className="px-6 py-2 rounded-full bg-cyan-500 text-white font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                                                <Zap size={16} fill="currentColor" />
                                                {isExternal ? 'BUKA' : 'TOP UP'}
                                            </div>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 transform translate-y-0 group-hover:translate-y-2 transition-transform duration-300">
                                            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                                                {game.name}
                                            </h3>
                                            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                {isExternal ? 'Link Eksternal' : 'Proses Otomatis'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {!loading && games.length === 0 && (
                    <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-gray-400">Belum ada game yang tersedia saat ini.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                        >
                            Refresh Halaman
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
