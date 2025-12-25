import HeroBanner from '@/components/home/HeroBanner'
import GameGrid from '@/components/home/GameGrid'

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <GameGrid />
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
