import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'CS', 'VIEWER'] }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Enrich with stats
        const staffWithStats = await Promise.all(staff.map(async (s: any) => {
            // ... (rest of the map logic is fine, `s` is any)
            const whereClause: any = {
                processed_by_id: s.id,
                status: 'APPROVED_2'
            }
            if (s.statsResetAt) {
                whereClause.createdAt = { gte: s.statsResetAt }
            }

            // Aggregate TopUp
            const topup = await prisma.transaction.aggregate({
                where: { ...whereClause, type: 'TOPUP' },
                _sum: { amount_money: true, amount_chip: true }
            })

            // Aggregate Withdraw
            const withdraw = await prisma.transaction.aggregate({
                where: { ...whereClause, type: 'WITHDRAW' },
                _sum: { amount_chip: true },
                _count: true
            })

            return {
                ...s,
                stats: {
                    topup_money: topup._sum.amount_money || 0,
                    topup_chip: topup._sum.amount_chip || 0,
                    withdraw_count: withdraw._count,
                    withdraw_chip: withdraw._sum.amount_chip || 0
                }
            }
        }))

        return NextResponse.json(staffWithStats)
    } catch (error) {
        console.error('Fetch staff error:', error)
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, password, role, permissions, isActive } = body

        // In a real app, hash the password here
        const user = await prisma.user.create({
            data: {
                username,
                password, // Plain text for now as per instructions
                role,
                permissions: permissions || '',
                isActive: isActive !== undefined ? isActive : true,
                balance_money: 0,
                balance_chip: 0,
                statsResetAt: new Date() // Start Fresh
            } as any
        })

        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, role, password, permissions, isActive, action } = body

        if (action === 'RESET_STATS') {
            const user = await prisma.user.update({
                where: { id: Number(id) },
                data: { statsResetAt: new Date() } as any
            })
            return NextResponse.json(user)
        }

        const data: any = { role }

        // ... rest of logic
        if (password) data.password = password
        if (permissions !== undefined) data.permissions = permissions
        if (isActive !== undefined) data.isActive = isActive

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: data
        })

        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.user.delete({
            where: { id: Number(id) }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
    }
}
