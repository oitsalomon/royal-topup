import HeroBanner from '@/components/home/HeroBanner'
import GameGrid from '@/components/home/GameGrid'

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <GameGrid />
      <footer className="text-center text-gray-600 text-xs py-10 mt-20 relative z-10">
        &copy; 2024 Royal TopUp. All rights reserved. <span className="opacity-50">v2.2</span>
      </footer>
    </div>
  )
}
