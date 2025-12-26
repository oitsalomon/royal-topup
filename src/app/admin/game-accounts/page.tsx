import { getGameAccounts } from '@/services/game-accounts'
import GameAccountsClient from './GameAccountsClient'

export const dynamic = 'force-dynamic'

export default async function AdminGameAccountsPage() {
    const accounts = await getGameAccounts()

    return (
        <GameAccountsClient initialAccounts={accounts} />
    )
}
