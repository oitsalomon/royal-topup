import { getActivityLogs, getStaffList } from '@/services/logs'
import LogsClient from './LogsClient'

export const dynamic = 'force-dynamic'

interface AdminLogsPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function AdminLogsPage({ searchParams }: AdminLogsPageProps) {
    const page = Number(searchParams.page) || 1
    const limit = 20
    const search = typeof searchParams.search === 'string' ? searchParams.search : ''
    const date = typeof searchParams.date === 'string' ? searchParams.date : ''
    const user_id = typeof searchParams.user_id === 'string' ? searchParams.user_id : 'all'
    const action = typeof searchParams.action === 'string' ? searchParams.action : 'all'

    // Serialize Date objects in logs if necessary, 
    // but Prisma returns objects. Client components need JSON-serializable props.
    // Date fields from Prisma are usually Date objects on the server.
    // We might need to transform them to strings.

    const logsData = await getActivityLogs({
        page, limit, search, date, user_id, action
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
