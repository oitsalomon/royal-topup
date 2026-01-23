import { NextResponse } from 'next/server'
import { getMemberDetail, updateMember, resetMemberCashback, updateUserGameId, deleteUserGameId, addUserGameId } from '@/services/admin-members' // Added addUserGameId import if missing
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1 // Fallback to System/SuperAdmin
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const member = await getMemberDetail(Number(id))
        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }
        return NextResponse.json(member)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json()
        const { id: idStr } = await params
        const id = Number(idStr)
        const { action, ...data } = body
        const adminId = getUserId(request)

        // Fetch member name for better logs
        const member = await prisma.user.findUnique({ where: { id }, select: { username: true } })
        const memberName = member?.username || 'Unknown'

        if (action === 'reset_cashback') {
            await resetMemberCashback(id)
            await prisma.activityLog.create({
                data: {
                    user_id: adminId,
                    action: 'UPDATE_MEMBER',
                    details: `Reset Cashback for member ${memberName}`
                }
            })
            return NextResponse.json({ success: true })
        }

        if (action === 'update_game_id') {
            await updateUserGameId(
                data.rowId,
                data.newGameUserId,
                data.newGameId ? Number(data.newGameId) : undefined
            )
            await prisma.activityLog.create({
                data: {
                    user_id: adminId,
                    action: 'UPDATE_MEMBER',
                    details: `Updated Game ID for ${memberName}: to ${data.newGameUserId}`
                }
            })
            return NextResponse.json({ success: true })
        }

        if (action === 'add_game_id') {
            await addUserGameId(id, Number(data.gameId), data.gameUserId)
            await prisma.activityLog.create({
                data: {
                    user_id: adminId,
                    action: 'UPDATE_MEMBER',
                    details: `Added Game ID for ${memberName}: ${data.gameUserId}`
                }
            })
            return NextResponse.json({ success: true })
        }

        if (action === 'delete_game_id') {
            await deleteUserGameId(data.rowId)
            await prisma.activityLog.create({
                data: {
                    user_id: adminId,
                    action: 'UPDATE_MEMBER',
                    details: `Deleted Game ID for ${memberName}`
                }
            })
            return NextResponse.json({ success: true })
        }

        // Standard Update (Password, Status, Bank, Level)
        await updateMember(id, data)

        let details = `Updated member ${memberName}`
        if (data.password) details = `Changed password for ${memberName}`
        if (data.level) details = `Changed level for ${memberName} to ${data.level}`
        if (data.isActive !== undefined) details = `${data.isActive ? 'Activated' : 'Banned'} member ${memberName}`

        await prisma.activityLog.create({
            data: {
                user_id: adminId,
                action: 'UPDATE_MEMBER',
                details
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Update Member Error:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}
