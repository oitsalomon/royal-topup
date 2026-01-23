import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/services/referral'

export async function GET() {
    try {
        // Find users with null referral_code
        const usersWithoutCode = await prisma.user.findMany({
            where: { referral_code: null },
            select: { id: true, username: true },
            take: 100 // Process in batches of 100 to avoid timeouts
        })

        const results = []

        for (const user of usersWithoutCode) {
            const newCode = await generateReferralCode()
            await prisma.user.update({
                where: { id: user.id },
                data: { referral_code: newCode }
            })
            results.push({ id: user.id, username: user.username, code: newCode })
        }

        return NextResponse.json({
            message: `Processed ${results.length} users`,
            remaining: await prisma.user.count({ where: { referral_code: null } }),
            results
        })

    } catch (error) {
        console.error('Backfill error:', error)
        return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
    }
}
