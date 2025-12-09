import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const dcbos = await prisma.dcBos.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(dcbos)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch DC BOS' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { user_id, amount, type, note } = body

        const result = await prisma.$transaction(async (tx) => {
            const dcbos = await tx.dcBos.create({
                data: {
                    user_id: Number(user_id),
                    amount: Number(amount),
                    type,
                    note
                }
            })

            // Update User Balance
            if (type === 'MONEY') {
                await tx.user.update({
                    where: { id: Number(user_id) },
                    data: { balance_money: { decrement: Number(amount) } }
                })
            } else if (type === 'CHIP') {
                await tx.user.update({
                    where: { id: Number(user_id) },
                    data: { balance_chip: { decrement: Number(amount) } }
                })
            }

            return dcbos
        })

        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create DC BOS' }, { status: 500 })
    }
}
