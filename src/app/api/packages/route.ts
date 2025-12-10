import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const getUserId = (req: Request) => {
    const id = req.headers.get('X-User-Id')
    return id ? Number(id) : 1
}

export async function GET() {
    try {
        let packages = await prisma.package.findMany({
            orderBy: { price: 'asc' }
        })

        if (packages.length === 0) {
            console.log('No packages found, seeding default packages...')
            const defaultPackages = [
                { name: '120 M', chip: 120, price: 10000 },
                { name: '170 M', chip: 170, price: 15000 },
                { name: '250 M', chip: 250, price: 20000 },
                { name: '350 M', chip: 350, price: 25000 },
                { name: '400 M', chip: 400, price: 30000 },
                { name: '500 M', chip: 500, price: 32500 },
                { name: '530 M', chip: 530, price: 35000 },
                { name: '600 M', chip: 600, price: 40000 },
                { name: '650 M', chip: 650, price: 45000 },
                { name: '750 M', chip: 750, price: 50000 },
                { name: '800 M', chip: 800, price: 55000 },
                { name: '900 M', chip: 900, price: 60000 },
                { name: '1 B', chip: 1000, price: 65000 },
            ]

            for (const p of defaultPackages) {
                await prisma.package.create({ data: { ...p, isActive: true } })
            }

            packages = await prisma.package.findMany({ orderBy: { price: 'asc' } })
        }

        return NextResponse.json(packages)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, chip, price } = body
        const userId = getUserId(request)

        const pkg = await prisma.package.create({
            data: {
                name,
                chip: Number(chip),
                price: Number(price),
                isActive: true
            }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_PACKAGE',
                details: `Created package: ${name} (${chip} Chip)`
            }
        })

        return NextResponse.json(pkg)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, chip, price, isActive } = body
        const userId = getUserId(request)

        const pkg = await prisma.package.update({
            where: { id: Number(id) },
            data: {
                name,
                chip: Number(chip),
                price: Number(price),
                isActive
            }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_PACKAGE',
                details: `Updated package ${pkg.name}: Rp ${price}`
            }
        })

        return NextResponse.json(pkg)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const userId = getUserId(request)

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const deletedPkg = await prisma.package.delete({
            where: { id: Number(id) }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'DELETE_PACKAGE',
                details: `Deleted package: ${deletedPkg.name}`
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
    }
}
