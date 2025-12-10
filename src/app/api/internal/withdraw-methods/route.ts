
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function GET() {
    try {
        const methods = await prisma.withdrawMethod.findMany({
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(methods)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch withdraw methods' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, type } = body
        const userId = getUserId(request)

        const method = await prisma.withdrawMethod.create({
            data: {
                name,
                type,
                isActive: true
            }
        })

        // Log
        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_WITHDRAW_METHOD',
                details: `Added new withdraw method: ${name}`
            }
        })

        return NextResponse.json(method)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, isActive } = body
        const userId = getUserId(request)

        const method = await prisma.withdrawMethod.update({
            where: { id: Number(id) },
            data: { isActive }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_WITHDRAW_METHOD',
                details: `Updated ${method.name} status to ${isActive}`
            }
        })

        return NextResponse.json(method)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const userId = getUserId(request)

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const deleted = await prisma.withdrawMethod.delete({
            where: { id: Number(id) }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'DELETE_WITHDRAW_METHOD',
                details: `Deleted withdraw method: ${deleted.name}`
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
