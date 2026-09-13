import { prisma } from '@/lib/prisma'

export interface StorePackageItem {
    id: number
    name: string
    chip: number
    price: number
    originalPrice?: number
    image?: string
    discount?: string
    badge?: string
    isPinned?: boolean
    qris_image?: string
}

export const DEFAULT_STORE_PACKAGES: StorePackageItem[] = [
    { id: 101, name: '150M', chip: 150, price: 10049, originalPrice: 10149, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 102, name: '200M', chip: 200, price: 13109, originalPrice: 13209, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 103, name: '300M', chip: 300, price: 19174, originalPrice: 19814, discount: '-3%', image: '/images/products/clover-chip.webp' },
    { id: 104, name: '400M', chip: 400, price: 26318, originalPrice: 26418, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 105, name: '500M', chip: 500, price: 32500, originalPrice: 33023, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 106, name: '600M', chip: 600, price: 39000, originalPrice: 39627, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 107, name: '700M', chip: 700, price: 45500, originalPrice: 46232, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 108, name: '800M', chip: 800, price: 52500, originalPrice: 52836, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 109, name: '900M', chip: 900, price: 58500, originalPrice: 59441, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 110, name: '1B', chip: 1000, price: 65010, originalPrice: 65148, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 111, name: '1.5B', chip: 1500, price: 97515, originalPrice: 97722, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 112, name: '2B', chip: 2000, price: 130020, originalPrice: 130295, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 113, name: '3B', chip: 3000, price: 195030, originalPrice: 195443, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 114, name: '4B', chip: 4000, price: 260040, originalPrice: 260590, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 115, name: '5B', chip: 5000, price: 325050, originalPrice: 325737, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 116, name: '10B', chip: 10000, price: 645010, originalPrice: 651474, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 117, name: '15B', chip: 15000, price: 967515, originalPrice: 977211, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 118, name: '20B', chip: 20000, price: 1280020, originalPrice: 1302948, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 119, name: '30B', chip: 30000, price: 1920030, originalPrice: 1923210, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 120, name: '40B', chip: 40000, price: 2560040, originalPrice: 2564280, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 121, name: '50B', chip: 50000, price: 3150050, originalPrice: 3205350, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 122, name: '75B', chip: 75000, price: 4725075, originalPrice: 4808025, discount: '-2%', image: '/images/products/clover-chip.webp' },
    { id: 123, name: '100B', chip: 100000, price: 6290100, originalPrice: 6303600, discount: '-1%', image: '/images/products/clover-chip.webp' },
    { id: 124, name: '150B', chip: 150000, price: 9420150, originalPrice: 9616050, discount: '-2%', image: '/images/products/clover-chip.webp' }
]

/**
 * Server-side function to retrieve packages with metadata for SSR rendering
 */
export async function getStorePackages(): Promise<StorePackageItem[]> {
    try {
        const packages = await prisma.package.findMany({
            where: { isActive: true },
            orderBy: { chip: 'asc' }
        })

        if (!packages || packages.length === 0) {
            return DEFAULT_STORE_PACKAGES
        }

        let metaMap: Record<string, any> = {}
        try {
            const metaConfig = await prisma.systemConfig.findUnique({
                where: { key: 'packages_meta' }
            })
            if (metaConfig?.value && typeof metaConfig.value === 'object') {
                metaMap = metaConfig.value as any
            }
        } catch {}

        const mapped: StorePackageItem[] = packages.map(pkg => {
            const extra = metaMap[pkg.id.toString()] || {}
            const originalPrice = extra.originalPrice || Math.round(pkg.price * 1.01)
            let disc = ''
            if (originalPrice > pkg.price) {
                const pct = Math.max(1, Math.round(((originalPrice - pkg.price) / originalPrice) * 100))
                disc = `-${pct}%`
            }
            return {
                id: pkg.id,
                name: pkg.name,
                chip: pkg.chip,
                price: pkg.price,
                originalPrice,
                image: (extra.image && extra.image !== '/images/products/clover-chip.jpg') ? extra.image : '/images/products/clover-chip.webp',
                discount: disc,
                badge: extra.badge || (pkg.chip >= 5000 ? 'Grosir' : pkg.chip >= 1000 ? 'Terlaris' : ''),
                isPinned: Boolean(extra.isPinned),
                qris_image: extra.qris_image || ''
            }
        })

        mapped.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            return a.price - b.price
        })

        return mapped
    } catch {
        return DEFAULT_STORE_PACKAGES
    }
}
