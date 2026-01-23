import { NextResponse } from 'next/server'
import { getSystemConfig, updateSystemConfig } from '@/services/config'

export async function GET() {
    const config = await getSystemConfig()
    return NextResponse.json(config)
}

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const userId = getUserId(request)
        const updatedConfig = await updateSystemConfig(body, userId)
        return NextResponse.json(updatedConfig)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
    }
}
