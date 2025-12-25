'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Gamepad2, ChevronRight } from 'lucide-react'

export default function GameGrid() {
    const [games, setGames] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetch('/api/games')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setGames(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const filteredGames = games.filter(g =>
        g.isActive &&
        g.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <section id="games" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                        <Gamepad2 className="text-emerald-400" size={32} />
                        Pilih Game
                    </h2>
                    <p className="text-gray-400">Silakan pilih game kesayangan Anda untuk mulai Top Up.</p>
                </div>

                {/* Search Bar */}
                <div className="relative group w-full md:w-auto">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="Cari Game..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#0f172a] border border-white/10 text-white pl-12 pr-6 py-3 rounded-2xl outline-none focus:border-emerald-500/50 w-full md:w-[300px] transition-all placeholder:text-gray-600 shadow-xl"
                        />
                        <Search className="absolute left-4 text-gray-500 group-hover:text-emerald-400 transition-colors" size={20} />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="aspect-[3/4] bg-white/5 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredGames.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-gray-500 text-lg">Game tidak ditemukan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                    {filteredGames.map((game) => (
                        <Link
                            key={game.id}
                            href={game.externalUrl || `/topup/${game.code}`}
                            className="group relative block"
                        >
                            {/* Card Container */}
                            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#0f172a] border border-white/5 shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] group-hover:-translate-y-2 group-hover:border-emerald-500/30">

                                {/* Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={game.image || '/images/placeholder-game.png'}
                                    alt={game.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050912] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                {/* Content info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-white font-bold text-lg leading-tight mb-1 truncate group-hover:text-emerald-400 transition-colors">{game.name}</h3>
                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-white transition-colors">
                                        <span>Top Up</span>
                                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}
