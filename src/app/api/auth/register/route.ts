import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/services/referral'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        let { username, password, whatsapp, bank_name, account_number, account_name, game_ids, referral_code } = body

        // 1. Basic Validation
        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
        }

        username = username.trim()
        if (username.length < 3) {
            return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
        }

        // WhatsApp Validation
        if (!whatsapp || whatsapp.length < 8) {
            return NextResponse.json({ error: 'Valid WhatsApp number is required' }, { status: 400 })
        }

        // 2. Bank Validation (Required per rules)
        if (!bank_name || !account_number || !account_name) {
            return NextResponse.json({ error: 'Bank details are required for cashback' }, { status: 400 })
        }

        // 3. Game ID Validation
        // game_ids should be an array of { game_id: number, game_user_id: string }
        if (game_ids && Array.isArray(game_ids)) {
            if (game_ids.length > 3) {
                return NextResponse.json({ error: 'Maximum 3 Game IDs allowed' }, { status: 400 })
            }
            // Check for duplicates in request
            const uniqueIds = new Set(game_ids.map((g: any) => `${g.game_id}-${g.game_user_id}`))
            if (uniqueIds.size !== game_ids.length) {
                return NextResponse.json({ error: 'Duplicate Game IDs in request' }, { status: 400 })
            }
        }

        // 4. Check Existing Username
        const existingUser = await prisma.user.findUnique({
            where: { username }
        })

        if (existingUser) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
        }

        // 4.5 Check Existing WhatsApp or Bank Account (Anti-Abuse)
        const duplicateAccount = await prisma.user.findFirst({
            where: {
                OR: [
                    { whatsapp },
                    { account_number }
                ]
            }
        })

        if (duplicateAccount) {
            if (duplicateAccount.whatsapp === whatsapp) {
                return NextResponse.json({ error: 'Nomor WhatsApp sudah terdaftar di akun lain.' }, { status: 400 })
            }
            if (duplicateAccount.account_number === account_number) {
                return NextResponse.json({ error: 'Nomor Rekening sudah terdaftar di akun lain.' }, { status: 400 })
            }
        }

        // 5. Check if Game IDs are already taken by OTHER users
        if (game_ids && game_ids.length > 0) {
            for (const gid of game_ids) {
                const existingLink = await prisma.userGameId.findFirst({
                    where: {
                        game_id: Number(gid.game_id),
                        game_user_id: gid.game_user_id
                    }
                })

                if (existingLink) {
                    return NextResponse.json({
                        error: `Game ID ${gid.game_user_id} is already registered to another account`
                    }, { status: 400 })
                }
            }
        }

        // 5.5 Check Referral Code if provided
        let referrerId: number | null = null
        if (referral_code) {
            const referrer = await prisma.user.findUnique({
                where: { referral_code: referral_code.trim() }
            })
            if (referrer) {
                referrerId = referrer.id
            } else {
                // If code provided but invalid, maybe return error or ignore?
                // Rules say "Saat user baru daftar lewat link/kode", usually implies we want to be strict.
                // But often sites just ignore invalid codes to not block signups.
                // Let's be strict for now as it's a specific system.
                return NextResponse.json({ error: 'Referral code is invalid' }, { status: 400 })
            }
        }

        // 6. Create User
        // Generate a new code for the new user
        const newUserReferralCode = await generateReferralCode()

        const newUser = await prisma.user.create({
            data: {
                username,
                password, // In a real app, hash this! But staying consistent with existing plain text for now.
                whatsapp,
                role: 'VIEWER', // Default role for members
                bank_name,
                account_number,
                account_name,
                level: 'BRONZE',
                total_exp: 0,
                referral_code: newUserReferralCode,
                referrer_id: referrerId,

                // Create Game IDs
                gameIds: {
                    create: game_ids?.map((gid: any) => ({
                        game_id: Number(gid.game_id),
                        game_user_id: gid.game_user_id,
                        nickname: gid.nickname
                    })) || []
                }
            }
        })

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                level: newUser.level
            }
        })

    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}
