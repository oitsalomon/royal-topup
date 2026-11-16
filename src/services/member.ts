import { prisma } from '@/lib/prisma'

const LP_RATE = 0.005 // 0.5%
// 1 LP = 200,000 transaction value

export function calculateLP(amount: number): number {
    // Round down to nearest integer
    return Math.floor(amount * LP_RATE)
}

export async function updateMemberStats(userId: number, amountChip: number, tx: any = prisma) {
    const db = tx || prisma
    if (amountChip <= 0) return

    // 1. Determine Week Start (Monday 00:00)
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(now.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)

    // 2. Get User Level
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { level: true, total_exp: true, loyalty_points: true }
    })

    if (!user) return

    // 3. Upsert Weekly Stats (For Leveling / Turnover tracking ONLY)
    let stats = await db.weeklyStats.findUnique({
        where: {
            user_id_week_start: {
                user_id: userId,
                week_start: weekStart
            }
        }
    })

    if (!stats) {
        stats = await db.weeklyStats.create({
            data: {
                user_id: userId,
                week_start: weekStart,
                total_turnover: 0,
                eligible_turnover: 0,
                cashback_earned: 0 // Keep as 0, unused
            }
        })
    }

    const rawAmount = amountChip * 1_000_000_000 // Turnover in Chips

    await db.weeklyStats.update({
        where: { id: stats.id },
        data: {
            total_turnover: { increment: rawAmount },
            eligible_turnover: { increment: rawAmount },
        }
    })

    // 5. Update EXP
    if (user.total_exp < 100) {
        await db.user.update({
            where: { id: userId },
            data: { total_exp: { increment: 5 } }
        })
    }
}

// NEW FUNCTION to separate LP logic safely
export async function awardLoyaltyPoints(userId: number, amountMoney: number, tx: any = prisma) {
    if (amountMoney < 200000) return // Min threshold implied? Or just calc 0?
    // 200k * 0.5% = 1000. Wait.
    // User says: "200.000 -> 1 LP".
    // 200,000 * 0.5% = 1,000.
    // User says "1 LP approx 200.000 transactions".
    // So 0.5% results in a value, but we divide by something?
    // "LP = 0,5% dari nilai pembelian" -> This is the VALUE of the LP?
    // "Contoh: 200.000 -> 1 LP"
    // If 1 LP = 200,000 purchase...
    // 200,000 * X = 1. => X = 1/200,000 = 0.000005.
    // 0.5% = 0.005.
    // 200,000 * 0.005 = 1,000.
    // So maybe 1 LP unit = 1,000 IDR worth of cashback?
    // BUT the system stores LP as INTEGER points.

    // Let's re-read:
    // "Rumus Tetap (FIX) LP = 0,5% dari nilai pembelian"
    // "Artinya: 1 LP ≈ 200.000 transaksi"

    // Verify math:
    // 200,000 * 0.5% = 1,000.
    // If 1 LP = 1,000 (value?), then 200k buy gets 1 LP.
    // 1,000,000 * 0.5% = 5,000. => 5 LP. MATCHES USER EXAMPLE.
    // 5,000,000 * 0.5% = 25,000. => 25 LP. MATCHES USER EXAMPLE.

    // CONCLUSION: LP = (Amount * 0.005) / 1000.
    // OR simpler: LP = Amount / 200,000.

    // Let's use the divisor rule: LP = Floor(Amount / 200,000).
    // Wait, does 300,000 get 1.5 LP? No, "LP otomatis masuk". Usually Int.

    const lpEarned = Math.floor(amountMoney / 200000)

    if (lpEarned > 0) {
        await tx.user.update({
            where: { id: userId },
            data: { loyalty_points: { increment: lpEarned } }
        })

        await tx.loyaltyLog.create({
            data: {
                user_id: userId,
                amount: lpEarned,
                source: 'TRANSACTION',
                description: `Reward from purchase Rp ${amountMoney.toLocaleString()}`
            }
        })
    }
}
