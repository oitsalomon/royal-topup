import { getBanks, getGamesForSelection } from '@/services/banks'
import BanksClient from './BanksClient'

export const dynamic = 'force-dynamic'

export default async function AdminBanksPage() {
    const banks = await getBanks()
    const availableGames = await getGamesForSelection()

    return (
        <BanksClient initialBanks={banks} availableGames={availableGames} />
    )
}
