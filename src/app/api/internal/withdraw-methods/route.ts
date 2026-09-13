
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function GET() {
    try {
        const [methods, config] = await Promise.all([
            prisma.withdrawMethod.findMany(),
            prisma.systemConfig.findUnique({
                where: { key: 'main_config' }
            })
        ])

        const orderList = ((config?.value as any)?.withdraw_methods_order as number[]) || []
        const orderMap = new Map<number, number>()
        orderList.forEach((id, idx) => orderMap.set(id, idx))

        const sorted = [...methods].sort((a, b) => {
            const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999
            const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999
            if (indexA !== indexB) return indexA - indexB
            return a.id - b.id
        })

        return NextResponse.json(sorted)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch withdraw methods' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, type = 'BANK' } = body
        const userId = getUserId(request)

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Nama metode wajib diisi' }, { status: 400 })
        }

        const method = await prisma.withdrawMethod.create({
            data: {
                name: name.trim(),
                type: type || 'BANK',
                isActive: true
            }
        })

        // Append to order list in config
        const configRecord = await prisma.systemConfig.findUnique({ where: { key: 'main_config' } })
        if (configRecord) {
            const configValue = (configRecord.value as any) || {}
            const currentOrder = (configValue.withdraw_methods_order as number[]) || []
            if (!currentOrder.includes(method.id)) {
                currentOrder.push(method.id)
                configValue.withdraw_methods_order = currentOrder
                await prisma.systemConfig.update({
                    where: { key: 'main_config' },
                    data: { value: configValue }
                })
            }
        }

        // Log
        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_WITHDRAW_METHOD',
                details: `Added new withdraw method: ${name} (${type})`
            }
        })

        return NextResponse.json(method)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create withdraw method' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, isActive, name, type, newOrder } = body
        const userId = getUserId(request)

        // Handle reordering if newOrder array is passed
        if (Array.isArray(newOrder)) {
            const configRecord = await prisma.systemConfig.findUnique({ where: { key: 'main_config' } })
            if (configRecord) {
                const configValue = (configRecord.value as any) || {}
                configValue.withdraw_methods_order = newOrder
                await prisma.systemConfig.update({
                    where: { key: 'main_config' },
                    data: { value: configValue }
                })
            }

            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'REORDER_WITHDRAW_METHODS',
                    details: 'Reordered withdraw methods popularity order'
                }
            })

            return NextResponse.json({ success: true, order: newOrder })
        }

        const updateData: any = {}
        if (typeof isActive === 'boolean') updateData.isActive = isActive
        if (name) updateData.name = name.trim()
        if (type) updateData.type = type

        const method = await prisma.withdrawMethod.update({
            where: { id: Number(id) },
            data: updateData
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_WITHDRAW_METHOD',
                details: `Updated ${method.name} properties`
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

        // Remove from order list in config
        const configRecord = await prisma.systemConfig.findUnique({ where: { key: 'main_config' } })
        if (configRecord) {
            const configValue = (configRecord.value as any) || {}
            const currentOrder = (configValue.withdraw_methods_order as number[]) || []
            const filteredOrder = currentOrder.filter(x => x !== Number(id))
            configValue.withdraw_methods_order = filteredOrder
            await prisma.systemConfig.update({
                where: { key: 'main_config' },
                data: { value: configValue }
            })
        }

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
