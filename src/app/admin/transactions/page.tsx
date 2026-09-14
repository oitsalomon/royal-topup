import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'
import { getJakartaTodayRange } from '@/lib/timezone'
import TransactionsClient from './TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
    const todayRange = getJakartaTodayRange()

    // 1. Fetch Transactions (Page 1) with Jakarta today range
    let transactionData = await getTransactions({
        page: 1,
        limit: 20,
        startDate: todayRange.startUTC.toISOString(),
        endDate: todayRange.endUTC.toISOString()
    })

    let isAllTimeFallback = false
    // Jika hari ini belum ada transaksi masuk (misal di awal hari / lewat tengah malam),
    // otomatis tampilkan riwayat transaksi terbaru agar dashboard tidak kosong melompong
    if (transactionData.pagination.total === 0) {
        const allTx = await getTransactions({
            page: 1,
            limit: 20
        })
        if (allTx.pagination.total > 0) {
            transactionData = allTx
            isAllTimeFallback = true
        }
    }

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
            initialDateRange={isAllTimeFallback ? {
                startDateStr: '',
                startTimeStr: '',
                endDateStr: '',
                endTimeStr: ''
            } : {
                startDateStr: todayRange.startDateStr,
                startTimeStr: todayRange.startTimeStr,
                endDateStr: todayRange.endDateStr,
                endTimeStr: todayRange.endTimeStr
            }}
            isAllTimeFallback={isAllTimeFallback}
            gameAccounts={gameAccounts}
            banks={banks}
        />
    )
}
