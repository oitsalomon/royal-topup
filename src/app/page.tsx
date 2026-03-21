import HeroBanner from '@/components/home/HeroBanner'
import LiveTicker from '@/components/home/LiveTicker'
import { getGames } from '@/services/games'
import { getSystemConfig } from '@/services/config'
import { Facebook, Instagram, Music, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

const getValidUrl = (url: string) => {
    if (!url) return '#'
    return url.startsWith('http') ? url : `https://${url}`
}

export default async function Home() {
  const games = await getGames(true) // Fetch only active games
  const config = await getSystemConfig()

  return (
    <div className="min-h-screen">
      <HeroBanner games={games} config={config} />
      <LiveTicker />
      
      <footer className="text-center py-12 relative z-10 border-t border-white/5 bg-[#050912]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center gap-6 mb-8">
            {(config as any)?.socials?.facebook && (
              <a href={getValidUrl((config as any).socials.facebook)} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all hover:scale-110 hover:-translate-y-1 shadow-lg group">
                <Facebook size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all" />
              </a>
            )}
            {(config as any)?.socials?.instagram && (
              <a href={getValidUrl((config as any).socials.instagram)} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all hover:scale-110 hover:-translate-y-1 shadow-lg group">
                <Instagram size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.5)] transition-all" />
              </a>
            )}
            {(config as any)?.socials?.tiktok && (
              <a href={getValidUrl((config as any).socials.tiktok)} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-tr hover:from-cyan-500 hover:via-black hover:to-pink-500 hover:border-pink-500/50 transition-all hover:scale-110 hover:-translate-y-1 shadow-lg group relative overflow-hidden">
                <svg viewBox="0 0 448 512" className="w-[18px] h-[18px] fill-current relative z-10 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all group-hover:animate-pulse">
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                </svg>
              </a>
            )}
            {(config as any)?.socials?.blogger && (
              <a href={getValidUrl((config as any).socials.blogger)} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all hover:scale-110 hover:-translate-y-1 shadow-lg group">
                <Globe size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all" />
              </a>
            )}
          </div>
          <p className="text-gray-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} <span className="text-emerald-500 font-bold">Clover Store</span>. All rights reserved.
          </p>
          <p className="text-gray-700 text-[10px] mt-2 font-mono">v2.4 Sultan Edition</p>
        </div>
      </footer>
    </div>
  )
}
