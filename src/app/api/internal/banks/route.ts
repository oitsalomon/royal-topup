import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_ID = 1 // Mock Admin ID

export async function GET() {
    try {
        const banks = await prisma.paymentMethod.findMany({
            include: { admin: true },
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
        const { name, type, account_number, account_name, admin_id, balance } = body

        // Create Bank
        const bank = await prisma.paymentMethod.create({
            data: {
                name,
                type,
                account_number,
                account_name,
                admin_id: admin_id ? Number(admin_id) : ADMIN_ID,
                balance: balance ? Number(balance) : 0,
                isActive: true
            }
        })

        // Log Activity
        await prisma.activityLog.create({
            data: {
                user_id: ADMIN_ID,
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
        const { id, name, type, account_number, account_name, balance, isActive } = body

        // Update Bank
        const bank = await prisma.paymentMethod.update({
            where: { id: Number(id) },
            data: {
                name,
                type,
                account_number,
                account_name,
                balance: balance !== undefined ? Number(balance) : undefined,
                isActive: isActive !== undefined ? isActive : undefined
            }
        })

        // Log Activity
        const actionDetails = isActive !== undefined
            ? `Updated status of bank ${bank.name} to ${isActive}`
            : `Updated details of bank ${bank.name}`

        await prisma.activityLog.create({
            data: {
                user_id: ADMIN_ID,
                action: 'UPDATE_BANK',
                details: actionDetails
            }
        })

        return NextResponse.json(bank)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update bank' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const deletedBank = await prisma.paymentMethod.delete({
            where: { id: Number(id) }
        })

        // Log Activity
        await prisma.activityLog.create({
            data: {
                user_id: ADMIN_ID,
                action: 'DELETE_BANK',
                details: `Deleted bank: ${deletedBank.name} (${deletedBank.account_number})`
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete bank' }, { status: 500 })
    }
}
