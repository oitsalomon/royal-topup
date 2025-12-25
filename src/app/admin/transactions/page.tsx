import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'
import TransactionsClient from './TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
    // 1. Fetch initial transactions (Server Side)
    const { data: transactions, pagination } = await getTransactions({
        page: 1,
        limit: 20
    })

    // 2. Fetch Helper Data (Bank & Game Accounts)
    const [gameAccounts, banks] = await Promise.all([
        prisma.gameAccount.findMany({
            where: { isActive: true },
            select: {
                id: true,
                username: true,
                balance: true,
                game: { select: { name: true } }
            },
            orderBy: { balance: 'desc' }
        }),
        prisma.paymentMethod.findMany({
            where: { type: 'BANK', isActive: true },
            select: { id: true, name: true, account_number: true, balance: true, account_name: true },
            orderBy: { name: 'asc' }
        })
    ])

    return (
        <TransactionsClient
            initialTransactions={transactions}
            initialPagination={pagination}
            gameAccounts={gameAccounts}
            banks={banks}
        />
    )
}
