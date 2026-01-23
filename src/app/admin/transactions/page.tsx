import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'
import TransactionsClient from './TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
    // 1. Fetch Transactions (Page 1)
    const transactionData = await getTransactions({ page: 1, limit: 20 })

    // 2. Fetch Helper Data (Game Accounts & Banks)
    // We can fetch these in parallel for speed
    const [gameAccounts, banks] = await Promise.all([
        prisma.gameAccount.findMany({ where: { isActive: true } }),
        prisma.paymentMethod.findMany({ where: { isActive: true, type: 'BANK' } })
    ])

    return (
        <TransactionsClient
            initialTransactions={transactionData.data}
            initialPagination={transactionData.pagination}
            gameAccounts={gameAccounts}
            banks={banks}
        />
    )
}
