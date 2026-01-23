import { NextResponse } from 'next/server'
import { getMembers } from '@/services/admin-members'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const search = searchParams.get('search') || ''
    const level = searchParams.get('level') || ''

    try {
        const result = await getMembers(page, limit, search, level)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Members API Error:', error)
        // @ts-ignore
        return NextResponse.json({ error: 'Failed to fetch members', details: error.message }, { status: 500 })
    }
}
