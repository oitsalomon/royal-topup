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
              <a href={getValidUrl((config as any).socials.facebook)} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center text-white transition-all duration-300 hover:scale-[1.15] hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(37,99,235,0.8)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Facebook size={26} fill="currentColor" className="relative z-10 drop-shadow-md" />
              </a>
            )}
            {(config as any)?.socials?.instagram && (
              <a href={getValidUrl((config as any).socials.instagram)} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 border border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center text-white transition-all duration-300 hover:scale-[1.15] hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(236,72,153,0.8)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Instagram size={26} className="relative z-10 drop-shadow-md" />
              </a>
            )}
            {(config as any)?.socials?.tiktok && (
              <a href={getValidUrl((config as any).socials.tiktok)} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00f2fe] via-black to-[#fe0979] border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center text-white transition-all duration-300 hover:scale-[1.15] hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(254,9,121,0.6)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <svg viewBox="0 0 448 512" className="w-[22px] h-[22px] fill-current relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                </svg>
              </a>
            )}
            {(config as any)?.socials?.blogger && (
              <a href={getValidUrl((config as any).socials.blogger)} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 border border-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.5)] flex items-center justify-center text-white transition-all duration-300 hover:scale-[1.15] hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(249,115,22,0.8)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Globe size={26} className="relative z-10 drop-shadow-md" />
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
