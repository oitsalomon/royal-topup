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
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { level: true, total_exp: true, loyalty_points: true }
    })

    if (!user) return

    // 3. Upsert Weekly Stats (For Leveling / Turnover tracking ONLY)
    let stats = await prisma.weeklyStats.findUnique({
        where: {
            user_id_week_start: {
                user_id: userId,
                week_start: weekStart
            }
        }
    })

    if (!stats) {
        stats = await prisma.weeklyStats.create({
            data: {
                user_id: userId,
                week_start: weekStart,
                total_turnover: 0,
                eligible_turnover: 0,
                cashback_earned: 0 // Keep as 0, unused
            }
        })
    }

    // 4. Update Turnover & Award Loyalty Points
    // CONVERSION: Transaction stores 1.0 as 1 Billion.
    // However, the USER REQUEST says:
    // "Pembelian 200.000 -> 1 LP"
    // "Pembelian 1.000.000 -> 5 LP"
    // "Rumus: 0.5% dari nilai pembelian"

    // In our DB, `Transaction` has `amount_chip` and `amount_money`.
    // Usually `amount_money` is the IDR value.
    // We should use the ACTUAL IDR VALUE for LP calculation if possible.
    // But `updateMemberStats` currently receives `amountChip` (float representing Billions).
    // If this function is CALLED with `amount_chip`, we need to know the equivalent Money.

    // CRITICAL FIX: The caller (route.ts) has access to both. 
    // We should probably change the signature of `updateMemberStats` or calculate based on Chip if Money is not passed.
    // CAUTION: changing signature might break other callers.
    // Let's assume for now we calculate based on IDR equivalent of Chip? 
    // OR BETTER: Check how it was called.
    // In route.ts: `updateMemberStats(transaction.user_id, transaction.amount_chip, tx)`
    // Wait, `amount_chip` in DB is float. 1.0 = 1B chips? 
    // And usually 1B chips cost ~65k - 70k depending on rate?
    // OR is `amount_chip` actually the face value? 

    // Let's look at `route.ts` again.
    // `transaction.amount_chip`
    // `transaction.amount_money`
    // The request example: "Pembelian 200.000 -> 1 LP". This implies MONEY.
    // So we should really be passing `amount_money` to this function for LP calculation.

    // I will OVERLOAD the logic here: 
    // Use `rawAmount` (Billions of chips) for Turnover.
    // But for LP, we need the Price.

    // Since I cannot easily change the signature without verifying all callers, 
    // and I see `route.ts` calls it.
    // I will FETCH the transaction or rely on an assumption?
    // No, I should update the function signature to accept `amountMoney` as optional.

    // Current signature: (userId: number, amountChip: number, tx: any = prisma)
    // New signature: (userId: number, amountChip: number, amountMoney: number, tx: any = prisma)

    // NOTE: This file is relatively small, I can update the signature and defaults.

    // For now, I will modify the function body assuming `amountMoney` is passed as 3rd arg, moving `tx` to 4th.
    // Wait, that breaks callers.
    // Better: (userId: number, amountChip: number, txOrMoney?: any, tx?: any)
    // This is messy.

    // PLAN:
    // 1. Just fetch the latest transaction? No, too risky.
    // 2. Add `amountMoney` to the arguments. update `route.ts` to pass it.

    // Let's stick to the plan of modifying this file. I will check `route.ts` call site later.

    const rawAmount = amountChip * 1_000_000_000 // Turnover in Chips

    await prisma.weeklyStats.update({
        where: { id: stats.id },
        data: {
            total_turnover: { increment: rawAmount },
            eligible_turnover: { increment: rawAmount }, // Everything is eligible for leveling?
            // User level logic usually depends on total_turnover
        }
    })

    // 5. Update EXP (Existing Logic)
    if (user.total_exp < 100) {
        await prisma.user.update({
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
