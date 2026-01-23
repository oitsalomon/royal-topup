import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function GET() {
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'CS', 'SUPER_ADMIN'] }
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
        const userId = getUserId(request)

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

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_STAFF',
                details: `Created new staff: ${username} (${role})`
            }
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
        const userId = getUserId(request)

        if (action === 'RESET_STATS') {
            const user = await prisma.user.update({
                where: { id: Number(id) },
                data: { statsResetAt: new Date() } as any
            })

            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'RESET_STATS',
                    details: `Reset stats for staff ID: ${id}`
                }
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

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_STAFF',
                details: `Updated staff ${user.username}: ${role}, Active: ${isActive}`
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = Number(searchParams.get('id'))
        const userId = getUserId(request)

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        // Perform Deep Clean / Cascade Delete manually
        // Perform Deep Clean / Cascade Delete (Sequential to avoid Transaction Timeout)

        // 1. Unlink Processed Transactions
        await prisma.transaction.updateMany({
            where: { processed_by_id: id },
            data: { processed_by_id: null }
        })

        // 2. Unlink Owned Transactions
        await prisma.transaction.updateMany({
            where: { user_id: id } as any, // Cast to any to avoid strict input type check if mismatched
            data: { user_id: null } as any
        })

        // 3. Delete Activity Logs
        await prisma.activityLog.deleteMany({
            where: { user_id: id }
        })

        // 4. Unlink Managed Banks
        await prisma.paymentMethod.updateMany({
            where: { admin_id: id },
            data: { admin_id: null }
        })

        const p = prisma as any

        // 5. Delete Member Specific Data (if any)
        await p.userGameId.deleteMany({ where: { user_id: id } })
        await p.weeklyStats.deleteMany({ where: { user_id: id } })
        await prisma.adjustment.deleteMany({ where: { user_id: id } })
        await prisma.transfer.deleteMany({ where: { from_user_id: id } })
        await prisma.transfer.deleteMany({ where: { to_user_id: id } })
        await p.dcBos.deleteMany({ where: { user_id: id } })

        // 6. Finally Delete User
        const deletedUser = await prisma.user.delete({
            where: { id }
        })

        // Log Action
        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'DELETE_STAFF',
                details: `Deleted user: ${deletedUser.username} (Deep Clean)`
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete User/Staff Error:', error)
        const msg = error instanceof Error ? error.message : 'Unknown dependency error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
