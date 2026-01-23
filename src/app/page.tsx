import HeroBanner from '@/components/home/HeroBanner'
import { getGames } from '@/services/games'
import { getSystemConfig } from '@/services/config'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

export default async function Home() {
  const games = await getGames(true) // Fetch only active games
  const config = await getSystemConfig()

  return (
    <div className="min-h-screen">
      <HeroBanner games={games} config={config} />
      <footer className="text-center py-12 relative z-10 border-t border-white/5 bg-[#050912]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-gray-500 text-sm font-medium">
            &copy; 2024 <span className="text-emerald-500 font-bold">Clover Store</span>. All rights reserved.
          </p>
          <p className="text-gray-700 text-[10px] mt-2 font-mono">v2.4 Sultan Edition</p>
        </div>
      </footer>
    </div>
  )
}
