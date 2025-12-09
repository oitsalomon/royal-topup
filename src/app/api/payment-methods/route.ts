import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        let methods = await prisma.paymentMethod.findMany()

        if (methods.length === 0) {
            console.log('No payment methods found, seeding defaults...')
            const defaultMethods = [
                { name: 'BCA', type: 'BANK', account_number: '1234567890', account_name: 'Aqua Store' },
                { name: 'Mandiri', type: 'BANK', account_number: '0987654321', account_name: 'Aqua Store' },
                { name: 'DANA', type: 'EWALLET', account_number: '081234567890', account_name: 'Aqua Store' },
                { name: 'OVO', type: 'EWALLET', account_number: '081234567891', account_name: 'Aqua Store' },
                { name: 'QRIS', type: 'EWALLET', account_number: '-', account_name: 'Aqua Store' },
            ]

            for (const m of defaultMethods) {
                await prisma.paymentMethod.create({ data: { ...m, isActive: true } })
            }

            methods = await prisma.paymentMethod.findMany()
        }

        return NextResponse.json(methods)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
    }
}
