import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'
import { getJakartaTodayRange } from '@/lib/timezone'
import TransactionsClient from './TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
    const todayRange = getJakartaTodayRange()

    // 1. Fetch Transactions (Page 1) with Jakarta today range
    const transactionData = await getTransactions({
        page: 1,
        limit: 20,
        startDate: todayRange.startUTC.toISOString(),
        endDate: todayRange.endUTC.toISOString()
    })

    // 2. Fetch Helper Data (Game Accounts & Banks)
    const [gameAccounts, banks] = await Promise.all([
        prisma.gameAccount.findMany({ where: { isActive: true } }),
        prisma.paymentMethod.findMany({ where: { isActive: true, type: 'BANK' } })
    ])

    return (
        <TransactionsClient
            initialTransactions={transactionData.data}
            initialPagination={transactionData.pagination}
            initialStats={transactionData.stats}
            initialDateRange={{
                startDateStr: todayRange.startDateStr,
                startTimeStr: todayRange.startTimeStr,
                endDateStr: todayRange.endDateStr,
                endTimeStr: todayRange.endTimeStr
            }}
            gameAccounts={gameAccounts}
            banks={banks}
        />
    )
}
