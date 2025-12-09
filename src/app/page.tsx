import HeroBanner from '@/components/home/HeroBanner'
import GameGrid from '@/components/home/GameGrid'

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <GameGrid />
    </div>
  )
}
