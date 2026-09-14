import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAdminUser, getClientIp } from '@/lib/session-helper'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Number(searchParams.get('limit')) || 100

        const expenses = await prisma.operationalExpense.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, username: true, role: true }
                }
            }
        })
        return NextResponse.json(expenses)
    } catch (error) {
        console.error('Fetch expenses error:', error)
        return NextResponse.json({ error: 'Failed to fetch operational expenses' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { amount, category, description, bank_name } = body

        const numAmount = Number(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            return NextResponse.json({ error: 'Nominal pengeluaran tidak valid (minimal lebih dari 0)' }, { status: 400 })
        }

        const admin = await resolveAdminUser(request)
        const clientIp = getClientIp(request)

        const expense = await prisma.operationalExpense.create({
            data: {
                user_id: admin.id,
                work_session_id: admin.work_session_id,
                amount: numAmount,
                category: category ? String(category).trim() : 'Operasional',
                description: description ? String(description).trim() : 'Biaya operasional',
                bank_name: bank_name ? String(bank_name).trim() : null
            },
            include: {
                user: {
                    select: { id: true, username: true }
                }
            }
        })

        const details = `Biaya ${expense.category}: ${expense.description} sebesar Rp ${numAmount.toLocaleString('id-ID')}${expense.bank_name ? ' (' + expense.bank_name + ')' : ''}`

        await prisma.activityLog.create({
            data: {
                user_id: admin.id,
                work_session_id: admin.work_session_id,
                action: 'BIAYA_OPERASIONAL',
                details,
                ip_address: clientIp
            }
        }).catch(err => console.error('ActivityLog expense error:', err))

        return NextResponse.json(expense)
    } catch (error: any) {
        console.error('Create expense error:', error)
        return NextResponse.json({ error: error?.message || 'Gagal menyimpan biaya operasional' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) {
            return NextResponse.json({ error: 'ID biaya wajib disertakan' }, { status: 400 })
        }

        const admin = await resolveAdminUser(request)
        const clientIp = getClientIp(request)

        const existing = await prisma.operationalExpense.findUnique({
            where: { id: Number(id) }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Data pengeluaran tidak ditemukan' }, { status: 404 })
        }

        await prisma.operationalExpense.delete({
            where: { id: Number(id) }
        })

        await prisma.activityLog.create({
            data: {
                user_id: admin.id,
                work_session_id: admin.work_session_id,
                action: 'HAPUS_BIAYA_OPERASIONAL',
                details: `Hapus biaya: ${existing.category} - ${existing.description} (Rp ${existing.amount.toLocaleString('id-ID')})`,
                ip_address: clientIp
            }
        }).catch(err => console.error('ActivityLog delete expense error:', err))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete expense error:', error)
        return NextResponse.json({ error: error?.message || 'Gagal menghapus biaya operasional' }, { status: 500 })
    }
}
