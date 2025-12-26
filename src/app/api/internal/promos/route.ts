import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const configs = await prisma.storePromoConfig.findMany({
            include: { packages: { orderBy: { price: 'asc' } } }
        })
        return NextResponse.json(configs)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, store_name, isPromoActive, promoTitle, packages } = body

        // Upsert Config
        const config = await prisma.storePromoConfig.upsert({
            where: { store_name }, // Use store_name as unique key
            update: {
                isPromoActive,
                promoTitle
            },
            create: {
                store_name,
                isPromoActive,
                promoTitle
            }
        })

        // Delete existing packages and recreate (simplest way to sync)
        if (config.id) {
            await prisma.promoPackage.deleteMany({
                where: { store_promo_id: config.id }
            })

            if (packages && packages.length > 0) {
                await prisma.promoPackage.createMany({
                    data: packages.map((p: any) => ({
                        store_promo_id: config.id,
                        name: p.name,
                        chip: Number(p.chip),
                        price: Number(p.price)
                    }))
                })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
