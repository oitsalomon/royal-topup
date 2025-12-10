
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const methods = await prisma.withdrawMethod.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(methods)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
