import HeroBanner from '@/components/home/HeroBanner'
import GameGrid from '@/components/home/GameGrid'

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <GameGrid />
      <footer className="text-center py-4 text-xs text-slate-700">v2.1</footer>
    </div>
  )
}
