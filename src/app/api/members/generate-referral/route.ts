import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/services/referral'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { user_id } = body

        if (!user_id) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: user_id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (user.referral_code) {
            return NextResponse.json({
                success: true,
                referral_code: user.referral_code,
                message: 'User already has a referral code'
            })
        }

        const newCode = await generateReferralCode()

        await prisma.user.update({
            where: { id: user_id },
            data: { referral_code: newCode }
        })

        return NextResponse.json({
            success: true,
            referral_code: newCode
        })

    } catch (error) {
        console.error('Generate referral error:', error)
        return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
    }
}
