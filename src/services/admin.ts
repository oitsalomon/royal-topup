import { prisma } from '@/lib/prisma'

export async function getDashboardStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
        const [
            banks,
            gameAccounts,
            pendingCount,
            dailyStats,
            totalStats,
            paymentHealth
        ] = await Promise.all([
            // 1. Fetch Banks
            prisma.paymentMethod.findMany({
                where: { type: 'BANK', isActive: true },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    account_number: true,
                    account_name: true,
                    balance: true,
                    type: true
                }
            }),

            // 2. Fetch Top 50 Game Accounts
            prisma.gameAccount.findMany({
                where: { isActive: true },
                take: 50,
                orderBy: { balance: 'desc' },
                select: {
                    id: true,
                    username: true,
                    balance: true,
                    game: {
                        select: { id: true, name: true, code: true }
                    }
                }
            }),

            // 3. Pending Count
            prisma.transaction.count({
                where: { status: 'PENDING' }
            }),

            // 4. Daily Stats
            (async () => {
                const [topup, withdraw] = await Promise.all([
                    prisma.transaction.aggregate({
                        where: {
                            type: 'TOPUP',
                            createdAt: { gte: today },
                            status: { in: ['APPROVED_1', 'APPROVED_2'] }
                        },
                        _count: true,
                        _sum: { amount_money: true, amount_chip: true }
                    }),
                    prisma.transaction.aggregate({
                        where: {
                            type: 'WITHDRAW',
                            createdAt: { gte: today },
                            status: { in: ['APPROVED_1', 'APPROVED_2'] }
                        },
                        _count: true,
                        _sum: { amount_money: true, amount_chip: true }
                    })
                ])

                return {
                    topup: {
                        count: topup._count,
                        money_in: topup._sum.amount_money || 0,
                        chip_out: topup._sum.amount_chip || 0
                    },
                    withdraw: {
                        count: withdraw._count,
                        money_out: withdraw._sum.amount_money || 0,
                        chip_in: withdraw._sum.amount_chip || 0
                    }
                }
            })(),

            // 5. Total Chip Balance
            prisma.gameAccount.aggregate({
                where: { isActive: true },
                _sum: { balance: true }
            }),

            // 6. Payment System Health Check
            getPaymentHealth()
        ])

        return {
            banks,
            gameAccounts,
            pendingCount,
            dailyStats,
            totalStats: {
                chipBalance: totalStats._sum.balance || 0
            },
            paymentHealth
        }
    } catch (error) {
        console.warn('Database unreachable in getDashboardStats, returning fallback data:', error)
        return {
            banks: [],
            gameAccounts: [],
            pendingCount: 0,
            dailyStats: {
                topup: { count: 0, money_in: 0, chip_out: 0 },
                withdraw: { count: 0, money_out: 0, chip_in: 0 }
            },
            totalStats: {
                chipBalance: 0
            },
            paymentHealth: {
                status: 'WARNING' as const,
                hasActiveQrisFallback: false,
                activeQrisMethods: [],
                packagesWithoutCustomQris: [],
                totalActivePackages: 0,
                methodsWithMissingImage: [],
                summaryMessage: 'Database belum terjangkau untuk verifikasi kesehatan QRIS.'
            }
        }
    }
}

export interface PaymentHealthData {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    hasActiveQrisFallback: boolean
    activeQrisMethods: { id: number; name: string; image?: string | null }[]
    packagesWithoutCustomQris: { id: number; name: string; price: number }[]
    totalActivePackages: number
    methodsWithMissingImage: { id: number; name: string; type: string }[]
    summaryMessage: string
}

export async function getPaymentHealth(): Promise<PaymentHealthData> {
    try {
        const [packages, paymentMethods, metaConfig] = await Promise.all([
            prisma.package.findMany({
                where: { isActive: true },
                select: { id: true, name: true, price: true },
                orderBy: { chip: 'asc' }
            }),
            prisma.paymentMethod.findMany({
                where: { isActive: true },
                select: { id: true, name: true, type: true, image: true, isActive: true }
            }),
            prisma.systemConfig.findUnique({
                where: { key: 'packages_meta' }
            })
        ])

        let metaMap: Record<string, any> = {}
        if (metaConfig?.value && typeof metaConfig.value === 'object') {
            metaMap = metaConfig.value as any
        }

        // 1. Packages without custom qris_image
        const packagesWithoutCustomQris = packages.filter(pkg => {
            const extra = metaMap[pkg.id.toString()] || {}
            return !extra.qris_image || extra.qris_image.trim() === ''
        }).map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price
        }))

        // 2. Active QRIS methods in PaymentMethod (fallback)
        const qrisMethods = paymentMethods.filter(m => 
            m.type === 'QRIS' || m.name?.toUpperCase().includes('QRIS')
        )
        const activeQrisWithImage = qrisMethods.filter(m => Boolean(m.image && m.image.trim() !== ''))
        const hasActiveQrisFallback = activeQrisWithImage.length > 0

        // 3. Payment methods with missing/empty image (specifically QRIS where image is mandatory)
        const methodsWithMissingImage = qrisMethods.filter(m => !m.image || m.image.trim() === '').map(m => ({
            id: m.id,
            name: m.name,
            type: m.type
        }))

        // Determine status
        let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY'
        let summaryMessage = 'Semua paket memiliki QRIS khusus nominal pas dan Fallback QR Toko aktif.'

        if (!hasActiveQrisFallback) {
            status = 'CRITICAL'
            summaryMessage = 'BAHAYA: Fallback QRIS Toko mati/tanpa foto! Pembeli yang memilih paket tanpa QR khusus tidak akan bisa membayar.'
        } else if (packagesWithoutCustomQris.length > 0 || methodsWithMissingImage.length > 0) {
            status = 'WARNING'
            summaryMessage = `${packagesWithoutCustomQris.length} dari ${packages.length} paket aktif belum memiliki QRIS nominal pas khusus (otomatis memakai QR Toko fallback).`
        }

        return {
            status,
            hasActiveQrisFallback,
            activeQrisMethods: activeQrisWithImage.map(m => ({ id: m.id, name: m.name, image: m.image })),
            packagesWithoutCustomQris,
            totalActivePackages: packages.length,
            methodsWithMissingImage,
            summaryMessage
        }
    } catch (error) {
        console.error('Failed to get payment health:', error)
        return {
            status: 'WARNING',
            hasActiveQrisFallback: false,
            activeQrisMethods: [],
            packagesWithoutCustomQris: [],
            totalActivePackages: 0,
            methodsWithMissingImage: [],
            summaryMessage: 'Gagal memeriksa status pembayaran saat ini.'
        }
    }
}
