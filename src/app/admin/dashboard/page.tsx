import { getDashboardStats } from '@/services/admin'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    // Fetch data on server side for instant load
    const data = await getDashboardStats()

    return <DashboardClient initialData={data} />
}
