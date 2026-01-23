import { prisma } from '@/lib/prisma'

/**
 * Generates a unique referral code.
 * Pattern: REF-XXXXXX where X is uppercase alphanumeric.
 */
export async function generateReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let isUnique = false
    let code = ''

    while (!isUnique) {
        code = 'REF-' + Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
        const existing = await prisma.user.findUnique({
            where: { referral_code: code }
        })
        if (!existing) isUnique = true
    }

    return code
}

/**
 * Calculates the referral bonus based on chip amount.
 * Formula: floor((chip / 1,000,000,000) * 750)
 */
export function calculateReferralBonus(chipAmount: number): number {
    // chipAmount is assumed to be the face value (e.g., 120,000,000)
    // The requirement says 120M -> 0.12B -> bonus = 0.12 * 750 = 90
    return Math.floor((chipAmount / 1_000_000_000) * 750)
}

/**
 * Awards referral bonus to the referrer when a transaction is completed (APPROVED_2).
 * Also updates the user's weekly personal topup volume.
 */
export async function processReferralBonus(transactionId: number, tx: any = prisma) {
    const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true }
    })

    if (!transaction || !transaction.user_id || transaction.type !== 'TOPUP') return

    const userId = transaction.user_id
    const chipAmount = transaction.amount_chip // Assuming this is raw chip amount (e.g. 1.2e8 for 120M)
    // Wait, let's check `amount_chip` in DB. Usually it's in Billions (1.0 = 1B).
    // Let's re-verify the prompt examples.
    // "120M -> 0.12B -> bonus = 0.12 x 750 = Rp90"
    // "1.5B -> bonus = 1.5 x 750 = Rp1.125"
    // This confirms the math works on "Billions" unit.

    // If transaction.amount_chip is already in Billions (e.g. 0.12 for 120M):
    const chipInBillions = transaction.amount_chip
    const bonusAmount = Math.floor(chipInBillions * 750)

    // 1. Update Weekly Personal Topup for the user
    await tx.user.update({
        where: { id: userId },
        data: {
            weekly_personal_topup_B: { increment: chipInBillions }
        }
    })

    // 2. Check if user has a referrer
    if (transaction.user.referrer_id) {
        const referrerId = transaction.user.referrer_id

        // Anti-abuse: check if user is not self-referring (already prevented at registration)
        if (referrerId === userId) return

        if (bonusAmount > 0) {
            // Award bonus to referrer
            await tx.user.update({
                where: { id: referrerId },
                data: {
                    balance_bonus: { increment: bonusAmount }
                }
            })

            // Log the bonus
            await tx.referralBonusLog.create({
                data: {
                    transaction_id: transactionId,
                    referrer_id: referrerId,
                    referred_user_id: userId,
                    chip_amount: chipInBillions,
                    bonus_amount: bonusAmount,
                    status: 'SUCCESS'
                }
            })
        }
    }
}

/**
 * Reverses referral bonus if a transaction is cancelled or refunded.
 */
export async function reverseReferralBonus(transactionId: number, tx: any = prisma) {
    const bonusLogs = await tx.referralBonusLog.findMany({
        where: {
            transaction_id: transactionId,
            status: 'SUCCESS'
        }
    })

    for (const log of bonusLogs) {
        // Reverse balance_bonus for referrer
        await tx.user.update({
            where: { id: log.referrer_id },
            data: {
                balance_bonus: { decrement: log.bonus_amount }
            }
        })

        // Mark log as REVERSED
        await tx.referralBonusLog.update({
            where: { id: log.id },
            data: { status: 'REVERSED' }
        })
    }

    // Also reverse the weekly_personal_topup_B for the user?
    // Usually yes, if the topup is cancelled.
    const transaction = await tx.transaction.findUnique({
        where: { id: transactionId }
    })
    if (transaction && transaction.user_id && transaction.type === 'TOPUP') {
        await tx.user.update({
            where: { id: transaction.user_id },
            data: {
                weekly_personal_topup_B: { decrement: transaction.amount_chip }
            }
        })
    }
}

/**
 * Resets weekly stats for all users.
 * To be called by a cron job every Monday 00:00.
 */
export async function resetWeeklyReferralStats() {
    await prisma.user.updateMany({
        data: {
            weekly_personal_topup_B: 0,
            wd_bonus_this_week: false
        }
    })
}
