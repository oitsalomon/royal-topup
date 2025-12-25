import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/services/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await getDashboardStats()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
