import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'
import ReferralWithdrawalsClient from './ReferralWithdrawalsClient'

export default async function ReferralWithdrawalsPage() {
    const transactions = await getTransactions({
        type: 'REFERRAL_WD',
        limit: 20
    })

    const banks = await prisma.paymentMethod.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    })

    return (
        <ReferralWithdrawalsClient
            initialTransactions={transactions.data}
            initialPagination={transactions.pagination}
            banks={banks}
        />
    )
}
