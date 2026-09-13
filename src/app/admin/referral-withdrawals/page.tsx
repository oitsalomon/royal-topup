import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ReferralWithdrawalsPage() {
    redirect('/admin/dashboard')
}
