import LandingContent from '@/components/home/LandingContent'
import { getGames } from '@/services/games'
import { getSystemConfig } from '@/services/config'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

export default async function Home() {
  const games = await getGames(true) // Fetch only active games
  const config = await getSystemConfig()

  return (
    <div className="min-h-screen">
      <LandingContent games={games} config={config} />
    </div>
  )
}
