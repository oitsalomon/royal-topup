import { getActivityLogs, getStaffList } from '@/services/logs'
import LogsClient from './LogsClient'

export const dynamic = 'force-dynamic'

interface AdminLogsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminLogsPage({ searchParams }: AdminLogsPageProps) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const limit = 20
    const search = typeof params.search === 'string' ? params.search : ''
    const date = typeof params.date === 'string' ? params.date : ''
    const user_id = typeof params.user_id === 'string' ? params.user_id : 'all'
    const action = typeof params.action === 'string' ? params.action : 'all'
    const role = typeof params.role === 'string' ? params.role : 'STAFF' // Default to STAFF as requested by user ("pisah")

    // Serialize Date objects in logs if necessary, 
    // but Prisma returns objects. Client components need JSON-serializable props.
    // Date fields from Prisma are usually Date objects on the server.
    // We might need to transform them to strings.

    const logsData = await getActivityLogs({
        page, limit, search, date, user_id, action, role
    })

    const staffList = await getStaffList()

    // Transform logs to be JSON serializable (Dates to strings)
    const serializedLogs = logsData.data.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString()
    }))

    return (
        <LogsClient
            initialLogs={serializedLogs}
            initialPagination={logsData.pagination}
            staffList={staffList}
        />
    )
}
