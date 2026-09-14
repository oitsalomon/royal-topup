import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSessionFromRequest } from '@/lib/auth'

async function resolveUserId(request: Request): Promise<number> {
    try {
        const session = await getAdminSessionFromRequest(request)
        if (session?.id) return session.id
    } catch {}

    const headerId = request.headers.get('X-User-Id')
    if (headerId && !isNaN(Number(headerId))) {
        return Number(headerId)
    }

    try {
        const defaultAdmin = await prisma.user.findFirst({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'CS'] } },
            select: { id: true }
        })
        if (defaultAdmin?.id) return defaultAdmin.id
    } catch {}

    return 1
}

function parseBalance(val: any): number | undefined {
    if (val === undefined || val === null || val === '') return undefined
    const cleaned = String(val).replace(',', '.').trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : Math.round(num * 1000) / 1000
}

export async function GET() {
    try {
        const accounts = await prisma.gameAccount.findMany({
            include: { game: true },
            orderBy: { isActive: 'desc' }
        })
        return NextResponse.json(accounts)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch game accounts' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { game_id, username, password, role, balance } = body
        const userId = await resolveUserId(request)
        const parsedBal = parseBalance(balance) ?? 0

        const account = await prisma.gameAccount.create({
            data: {
                game_id: Number(game_id) || 1,
                username: String(username).trim(),
                password: password ? String(password).trim() : null,
                role: role || 'ALL', // DEPOSIT, WITHDRAW, ALL, GUDANG
                balance: parsedBal,
                isActive: true
            }
        })

        prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_GAME_ACCOUNT',
                details: `Created game account: ${account.username} (${account.role}) with balance ${account.balance}B`
            }
        }).catch(err => console.error('ActivityLog create error:', err))

        return NextResponse.json(account)
    } catch (error: any) {
        console.error('Create game account error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to create game account' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, game_id, username, password, role, balance, isActive } = body

        if (!id) {
            return NextResponse.json({ error: 'ID Game Account wajib disertakan' }, { status: 400 })
        }

        const userId = await resolveUserId(request)
        const parsedBal = parseBalance(balance)

        const oldAccount = await prisma.gameAccount.findUnique({
            where: { id: Number(id) }
        })

        if (!oldAccount) {
            return NextResponse.json({ error: 'Akun game tidak ditemukan' }, { status: 404 })
        }

        const updateData: any = {}
        if (game_id) updateData.game_id = Number(game_id)
        if (username !== undefined) updateData.username = String(username).trim()
        if (password && String(password).trim().length > 0) {
            updateData.password = String(password).trim()
        }
        if (role !== undefined) updateData.role = role
        if (parsedBal !== undefined) updateData.balance = parsedBal
        if (isActive !== undefined) updateData.isActive = Boolean(isActive)

        const account = await prisma.gameAccount.update({
            where: { id: Number(id) },
            data: updateData,
            include: { game: true }
        })

        const isChipEdited = parsedBal !== undefined && Number(oldAccount.balance) !== Number(parsedBal)

        if (isChipEdited) {
            const oldBal = Number(oldAccount.balance)
            const newBal = Number(parsedBal)
            const diff = newBal - oldBal
            const diffText = (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' B'
            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'EDIT_CHIP',
                    details: `Edit Stok Chip ID ${account.username}: ${oldBal.toFixed(2)} B -> ${newBal.toFixed(2)} B (Selisih: ${diffText})`,
                    ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
                }
            }).catch(err => console.error('ActivityLog EDIT_CHIP error:', err))
        } else {
            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'UPDATE_GAME_ACCOUNT',
                    details: `Update data akun game ${account.username} (Role: ${account.role}, Balance: ${account.balance}B, Active: ${account.isActive})`,
                    ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
                }
            }).catch(err => console.error('ActivityLog update error:', err))
        }

        return NextResponse.json(account)
    } catch (error: any) {
        console.error('Update game account error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to update game account' }, { status: 500 })
    }
}
