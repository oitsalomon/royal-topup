import { getDashboardStats } from '@/services/admin'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    // 1. Fetch data on the server (Instant Load)
    // No more "Loading..." skeleton on the client
    const initialData = await getDashboardStats()

    return <DashboardClient initialData={initialData} />
}
