import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function GET() {
    try {
        const banks = await prisma.paymentMethod.findMany({
            include: {
                admin: true,
                games: true // Include game relations
            },
            orderBy: { isActive: 'desc' }
        })
        return NextResponse.json(banks)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, type, account_number, account_name, admin_id, balance, image, gameIds } = body
        const userId = getUserId(request)

        // Create Bank
        const bank = await prisma.paymentMethod.create({
            data: {
                name,
                type,
                account_number,
                account_name,
                admin_id: admin_id ? Number(admin_id) : userId,
                balance: balance ? Number(balance) : 0,
                image: image || null,
                category: body.category || 'BOTH',
                isActive: true,
                games: {
                    connect: gameIds?.map((id: number) => ({ id: Number(id) })) || []
                }
            }
        })

        // Log Activity
        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_BANK',
                details: `Added new bank: ${name} (${account_number})`
            }
        })

        return NextResponse.json(bank)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create bank' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, type, account_number, account_name, balance, isActive, image, category, gameIds } = body
        const userId = getUserId(request)

        // Update Bank with Relations
        const bank = await prisma.paymentMethod.update({
            where: { id: Number(id) },
            data: {
                name,
                type,
                account_number,
                account_name,
                balance: balance !== undefined ? Number(balance) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                image: image !== undefined ? image : undefined,
                category: category !== undefined ? category : undefined,
                games: gameIds !== undefined ? {
                    set: gameIds.map((gid: number) => ({ id: Number(gid) }))
                } : undefined
            }
        })

        // Log Activity
        const actionDetails = isActive !== undefined
            ? `Updated status of bank ${bank.name} to ${isActive}`
            : `Updated details of bank ${bank.name}`

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_BANK',
                details: actionDetails
            }
        })

        return NextResponse.json(bank)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update bank' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const userId = getUserId(request)

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        try {
            // Try Hard Delete first
            const deletedBank = await prisma.paymentMethod.delete({
                where: { id: Number(id) }
            })

            // Log Activity (Hard Delete)
            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'DELETE_BANK',
                    details: `Deleted bank permanently: ${deletedBank.name} (${deletedBank.account_number})`
                }
            })
        } catch (error: any) {
            // Foreign Key Constraint Violation (P2003) -> Soft Delete
            if (error.code === 'P2003') {
                const softDeleted = await prisma.paymentMethod.update({
                    where: { id: Number(id) },
                    data: { isActive: false }
                })

                // Log Activity (Soft Delete)
                await prisma.activityLog.create({
                    data: {
                        user_id: userId,
                        action: 'ARCHIVE_BANK',
                        details: `Archived bank (soft delete) due to dependencies: ${softDeleted.name}`
                    }
                })
                return NextResponse.json({ success: true, message: 'Bank diarsipkan karena memiliki riwayat transaksi' })
            }
            throw error // Rethrow other errors
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete Bank Error:', error)
        return NextResponse.json({ error: 'Failed to delete bank' }, { status: 500 })
    }
}
