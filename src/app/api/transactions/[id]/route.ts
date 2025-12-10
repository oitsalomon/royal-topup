import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : null
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { target_payment_details, user_game_id, admin_id } = body

        let userId = getUserId(request)
        if (!userId && admin_id) userId = Number(admin_id)
        if (!userId) userId = 1

        const updated = await prisma.transaction.update({
            where: { id: Number(id) },
            data: {
                target_payment_details: target_payment_details !== undefined ? target_payment_details : undefined,
                user_game_id: user_game_id !== undefined ? user_game_id : undefined,
            }
        })

        // Log Activity
        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_TX',
                details: `Updated Transaction #${id}. Target: ${target_payment_details?.substring(0, 50) || 'N/A'}, GameID: ${user_game_id || 'N/A'}`,
                ip_address: '127.0.0.1'
            }
        })

        return NextResponse.json(updated)

    } catch (error) {
        console.error('Update TX Error:', error)
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }
}
