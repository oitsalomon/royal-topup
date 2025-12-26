import { getGames } from '@/services/games'
import GamesClient from './GamesClient'

export const dynamic = 'force-dynamic'

export default async function AdminGamesPage() {
    const games = await getGames()

    return (
        <GamesClient initialGames={games} />
    )
}
