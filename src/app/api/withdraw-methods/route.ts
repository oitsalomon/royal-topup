
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const [methods, config] = await Promise.all([
            prisma.withdrawMethod.findMany({
                where: { isActive: true }
            }),
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
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
