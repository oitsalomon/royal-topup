import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAdminSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function revalidatePublicPages() {
    try {
        revalidatePath('/')
        revalidatePath('/topup')
        revalidatePath('/topup/[game]', 'page')
        revalidatePath('/preview-topup/[game]', 'page')
    } catch (e) {
        console.warn('Revalidation error:', e)
    }
}

const DEFAULT_PACKAGES = [
    { id: 101, name: '150M', chip: 150, price: 10049, originalPrice: 10149, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 102, name: '200M', chip: 200, price: 13109, originalPrice: 13209, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 103, name: '300M', chip: 300, price: 19174, originalPrice: 19814, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 104, name: '400M', chip: 400, price: 26318, originalPrice: 26418, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 105, name: '500M', chip: 500, price: 32500, originalPrice: 33023, image: '/images/products/clover-chip.webp', badge: 'Populer', qris_image: '', isActive: true },
    { id: 106, name: '600M', chip: 600, price: 39000, originalPrice: 39627, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 107, name: '700M', chip: 700, price: 45500, originalPrice: 46232, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 108, name: '800M', chip: 800, price: 52500, originalPrice: 52836, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 109, name: '900M', chip: 900, price: 58500, originalPrice: 59441, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 110, name: '1B', chip: 1000, price: 65010, originalPrice: 65148, image: '/images/products/clover-chip.webp', badge: 'Terlaris', qris_image: '', isActive: true },
    { id: 111, name: '1.5B', chip: 1500, price: 97515, originalPrice: 97722, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 112, name: '2B', chip: 2000, price: 130020, originalPrice: 130295, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 113, name: '3B', chip: 3000, price: 195030, originalPrice: 195443, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 114, name: '4B', chip: 4000, price: 260040, originalPrice: 260590, image: '/images/products/clover-chip.webp', badge: '', qris_image: '', isActive: true },
    { id: 115, name: '5B', chip: 5000, price: 325050, originalPrice: 325737, image: '/images/products/clover-chip.webp', badge: 'Grosir', qris_image: '', isActive: true },
    { id: 116, name: '10B', chip: 10000, price: 645010, originalPrice: 651474, image: '/images/products/clover-chip.webp', badge: 'Grosir', qris_image: '', isActive: true },
    { id: 117, name: '15B', chip: 15000, price: 967515, originalPrice: 977211, image: '/images/products/clover-chip.webp', badge: 'Grosir', qris_image: '', isActive: true },
    { id: 118, name: '20B', chip: 20000, price: 1280020, originalPrice: 1302948, image: '/images/products/clover-chip.webp', badge: 'Sultan', qris_image: '', isActive: true },
    { id: 119, name: '30B', chip: 30000, price: 1920030, originalPrice: 1923210, image: '/images/products/clover-chip.webp', badge: 'Sultan', qris_image: '', isActive: true },
    { id: 120, name: '40B', chip: 40000, price: 2560040, originalPrice: 2564280, image: '/images/products/clover-chip.webp', badge: 'Sultan', qris_image: '', isActive: true },
    { id: 121, name: '50B', chip: 50000, price: 3150050, originalPrice: 3205350, image: '/images/products/clover-chip.webp', badge: 'Sultan', qris_image: '', isActive: true },
    { id: 122, name: '75B', chip: 75000, price: 4725075, originalPrice: 4808025, image: '/images/products/clover-chip.webp', badge: 'Sultan', qris_image: '', isActive: true },
    { id: 123, name: '100B', chip: 100000, price: 6290100, originalPrice: 6303600, image: '/images/products/clover-chip.webp', badge: 'Sultan', qris_image: '', isActive: true },
    { id: 124, name: '150B', chip: 150000, price: 9420150, originalPrice: 9616050, image: '/images/products/clover-chip.webp', badge: 'Sultan', qris_image: '', isActive: true },
]

export async function GET() {
    try {
        let packages: any[] = []
        try {
            packages = await prisma.package.findMany({
                orderBy: { price: 'asc' }
            })
        } catch (dbErr) {
            console.warn('Database offline/slow for packages, using fallback defaults.')
        }

        if (packages.length === 0) {
            return NextResponse.json(DEFAULT_PACKAGES)
        }

        // Fetch custom metadata (image, originalPrice, badge, qris_image) from SystemConfig
        let metaMap: Record<string, any> = {}
        try {
            const metaConfig = await prisma.systemConfig.findUnique({
                where: { key: 'packages_meta' }
            })
            if (metaConfig?.value && typeof metaConfig.value === 'object') {
                metaMap = metaConfig.value as any
            }
        } catch {}

        const merged = packages.map(pkg => {
            const extra = metaMap[pkg.id.toString()] || {}
            return {
                id: pkg.id,
                name: pkg.name,
                chip: pkg.chip,
                price: pkg.price,
                originalPrice: extra.originalPrice || Math.round(pkg.price * 1.1),
                image: (extra.image && extra.image !== '/images/products/clover-chip.jpg') ? extra.image : (pkg.image || '/images/products/clover-chip.webp'),
                badge: extra.badge || (pkg.chip >= 5000 ? 'Grosir' : pkg.chip >= 1000 ? 'Terlaris' : ''),
                isPinned: Boolean(extra.isPinned),
                qris_image: extra.qris_image || '',
                isActive: pkg.isActive
            }
        })

        // Sort: Pinned packages first, then by price ascending
        merged.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            return a.price - b.price
        })

        return NextResponse.json(merged)
    } catch (error) {
        return NextResponse.json(DEFAULT_PACKAGES)
    }
}

export async function POST(request: Request) {
    try {
        const adminSession = await getAdminSessionFromRequest(request)
        if (!adminSession) {
            return NextResponse.json({ error: 'Unauthorized: Hanya admin yang berwenang membuat paket' }, { status: 401 })
        }
        const userId = adminSession.id
        const body = await request.json()
        const { name, chip, price, originalPrice, image, badge, isPinned, qris_image } = body

        const pkg = await prisma.package.create({
            data: {
                name,
                chip: Number(chip),
                price: Number(price),
                isActive: true
            }
        })

        // Save extra metadata (image, originalPrice, badge, isPinned, qris_image) into SystemConfig
        try {
            const existing = await prisma.systemConfig.findUnique({ where: { key: 'packages_meta' } })
            const map = (existing?.value as any) || {}
            map[pkg.id.toString()] = {
                image: image || '/images/products/clover-chip.webp',
                originalPrice: Number(originalPrice) || 0,
                badge: badge || '',
                isPinned: Boolean(isPinned),
                qris_image: typeof qris_image === 'string' ? qris_image.trim() : ''
            }
            await prisma.systemConfig.upsert({
                where: { key: 'packages_meta' },
                update: { value: map },
                create: { key: 'packages_meta', value: map }
            })
        } catch {}

        try {
            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'CREATE_PACKAGE',
                    details: `Created package: ${name} (${chip} Chip) - Rp ${price}`
                }
            })
        } catch {}

        revalidatePublicPages()
        return NextResponse.json({ ...pkg, qris_image: typeof qris_image === 'string' ? qris_image.trim() : '' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const adminSession = await getAdminSessionFromRequest(request)
        if (!adminSession) {
            return NextResponse.json({ error: 'Unauthorized: Hanya admin yang berwenang mengubah paket' }, { status: 401 })
        }
        const userId = adminSession.id
        const body = await request.json()
        const { id, name, chip, price, originalPrice, image, badge, isActive, isPinned, qris_image } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (chip !== undefined) updateData.chip = Number(chip)
        if (price !== undefined) updateData.price = Number(price)
        if (isActive !== undefined) updateData.isActive = isActive

        const pkg = await prisma.package.update({
            where: { id: Number(id) },
            data: updateData
        })

        // Update extra metadata (image, originalPrice, badge, isPinned, qris_image)
        try {
            const existing = await prisma.systemConfig.findUnique({ where: { key: 'packages_meta' } })
            const map = (existing?.value as any) || {}
            map[id.toString()] = {
                image: image !== undefined ? image : map[id.toString()]?.image || '',
                originalPrice: originalPrice !== undefined ? Number(originalPrice) : map[id.toString()]?.originalPrice || 0,
                badge: badge !== undefined ? badge : map[id.toString()]?.badge || '',
                isPinned: isPinned !== undefined ? Boolean(isPinned) : Boolean(map[id.toString()]?.isPinned),
                qris_image: qris_image !== undefined ? (typeof qris_image === 'string' ? qris_image.trim() : '') : (map[id.toString()]?.qris_image || '')
            }
            await prisma.systemConfig.upsert({
                where: { key: 'packages_meta' },
                update: { value: map },
                create: { key: 'packages_meta', value: map }
            })
        } catch {}

        try {
            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'UPDATE_PACKAGE',
                    details: `Updated package ${pkg.name}: Rp ${price}`
                }
            })
        } catch {}

        revalidatePublicPages()
        return NextResponse.json({ ...pkg, qris_image: qris_image !== undefined ? qris_image : '' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const adminSession = await getAdminSessionFromRequest(request)
        if (!adminSession) {
            return NextResponse.json({ error: 'Unauthorized: Hanya admin yang berwenang menghapus paket' }, { status: 401 })
        }
        const userId = adminSession.id
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        await prisma.package.delete({
            where: { id: Number(id) }
        })

        // Remove from metadata if exists
        try {
            const existing = await prisma.systemConfig.findUnique({ where: { key: 'packages_meta' } })
            const map = (existing?.value as any) || {}
            delete map[id.toString()]
            await prisma.systemConfig.upsert({
                where: { key: 'packages_meta' },
                update: { value: map },
                create: { key: 'packages_meta', value: map }
            })
        } catch {}

        try {
            await prisma.activityLog.create({
                data: {
                    user_id: userId,
                    action: 'DELETE_PACKAGE',
                    details: `Deleted package ID: ${id}`
                }
            })
        } catch {}

        revalidatePublicPages()
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
    }
}
