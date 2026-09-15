import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTransactions } from '@/services/transactions'
import { updateMemberStats } from '@/services/member'
import { sendTopupNotif, sendWithdrawNotif } from '@/lib/telegram'
import { getAdminSessionFromRequest } from '@/lib/auth'
import { createTransactionSchema, sanitizeText } from '@/lib/validations'
import { getSystemConfig } from '@/services/config'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))

        // 1. Validasi Input Dasar via Zod
        const validation = createTransactionSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0]?.message || 'Data transaksi tidak valid'
            }, { status: 400 })
        }

        const validData = validation.data
        const user_wa = sanitizeText(validData.user_wa)
        const user_game_id = sanitizeText(validData.user_game_id)
        const nickname = sanitizeText(validData.nickname)
        const type = validData.type
        const target_payment_details = validData.target_payment_details ? sanitizeText(validData.target_payment_details) : null
        const sender_name = validData.sender_name ? sanitizeText(validData.sender_name) : null

        let finalAmountChip = 0
        let finalAmountMoney = 0

        // =========================================================================
        // 2. SERVER-SIDE PRICING ENFORCEMENT (CELAH HARGA DIKUNCI TOTAL)
        // =========================================================================
        if (type === 'TOPUP') {
            let pkg: any = null

            // Prioritas 1: Cari berdasarkan package_id
            if (validData.package_id) {
                pkg = await prisma.package.findUnique({
                    where: { id: Number(validData.package_id) }
                })
            }

            // Prioritas 2: Jika tidak ada package_id, cari berdasarkan amount_chip
            if (!pkg && validData.amount_chip) {
                const chipM = Math.round(validData.amount_chip * 1000)
                pkg = await prisma.package.findFirst({
                    where: { chip: chipM, isActive: true }
                })
            }

            // WAJIB VALID: Jika paket tidak ditemukan atau non-aktif, TOLAK LANGSUNG!
            if (!pkg || pkg.isActive === false) {
                return NextResponse.json({
                    error: 'Paket chip tidak valid atau sudah tidak aktif.'
                }, { status: 400 })
            }

            // Ambil Chip & Harga 100% MURNI DARI DATABASE
            finalAmountChip = pkg.chip >= 100 ? (pkg.chip / 1000) : pkg.chip // Konversi ke Billion (B)
            finalAmountMoney = Number(pkg.price) // Harga resmi server

            // Tambahkan Kode Unik (1-199) HANYA untuk QRIS, dan di-generate ONCE di sini
            let paymentMethodName = ''
            if (validData.payment_method_id) {
                const pm = await prisma.paymentMethod.findUnique({
                    where: { id: Number(validData.payment_method_id) }
                })
                if (pm) paymentMethodName = pm.name
            }

            const isQRIS = paymentMethodName.toLowerCase().includes('qris')
            if (isQRIS) {
                const uniqueCode = Math.floor(Math.random() * 199) + 1
                finalAmountMoney += uniqueCode
            }
        } else if (type === 'WITHDRAW') {
            // Validasi Penarikan / Bongkar
            const chipB = Number(validData.amount_chip) || 0
            if (chipB < 0.5) {
                return NextResponse.json({
                    error: 'Minimal penarikan adalah 0.5B (500M) chip.'
                }, { status: 400 })
            }

            if (!target_payment_details || target_payment_details.trim().length === 0) {
                return NextResponse.json({
                    error: 'Detail rekening tujuan penarikan wajib diisi.'
                }, { status: 400 })
            }

            finalAmountChip = chipB

            // Hitung harga buyback resmi di server: Rp 60.000 per 1B, 500M (0.5B) = Rp 25.000
            const grossPayout = chipB === 0.5 ? 25000 : Math.round(chipB * 60000)
            const isRegisteredMember = Boolean(validData.user_id)

            // Ambil biaya admin guest dari SystemConfig di database
            const systemConfig: any = await getSystemConfig()
            const guestFee = typeof systemConfig?.guest_withdraw_fee === 'number'
                ? systemConfig.guest_withdraw_fee
                : 2500

            const adminFee = isRegisteredMember ? 0 : guestFee
            finalAmountMoney = Math.max(0, grossPayout - adminFee)

            // Validasi nomor rekening / e-wallet di backend jika metode dipilih
            if (validData.payment_method_id) {
                const wm = await prisma.withdrawMethod.findUnique({
                    where: { id: Number(validData.payment_method_id) }
                })
                if (wm) {
                    const isEwallet = wm.type === 'EWALLET'
                    const ewalletRegex = /^(?:(?:\+|00)?62|0)[8][0-9]{8,12}$/
                    const bankRegex = /^[0-9]{8,20}$/
                    const parts = target_payment_details.split('-')
                    if (parts.length > 1) {
                        const accPart = parts[1].split('(')[0]?.trim().replace(/[\s-]/g, '') || ''
                        if (isEwallet && accPart && !ewalletRegex.test(accPart)) {
                            return NextResponse.json({
                                error: 'Nomor e-wallet tidak valid. Gunakan format nomor HP 08xx/62xx (10-14 digit).'
                            }, { status: 400 })
                        } else if (!isEwallet && accPart && !bankRegex.test(accPart)) {
                            return NextResponse.json({
                                error: 'Nomor rekening bank tidak valid. Masukkan 8-20 digit angka.'
                            }, { status: 400 })
                        }
                    }
                }
            }
        } else {
            return NextResponse.json({ error: 'Tipe transaksi tidak dikenali.' }, { status: 400 })
        }

        // 3. Identifikasi User (Member ID)
        let userId: number | null = null
        if (validData.user_id) userId = Number(validData.user_id)

        if (!userId && user_game_id) {
            const linked = await prisma.userGameId.findFirst({
                where: {
                    game_id: Number(validData.game_id),
                    game_user_id: user_game_id
                }
            })
            if (linked) userId = linked.user_id
        }

        // 4. Generate Unique TRX ID
        const now = new Date()
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase() // 4 chars
        const trx_id = `CL-${dateStr}-${randomStr}`

        const transactionData: any = {
            trx_id,
            user_wa,
            user_id: userId,
            game_id: Number(validData.game_id),
            user_game_id,
            nickname,
            amount_chip: finalAmountChip,
            amount_money: finalAmountMoney,
            proof_image: validData.proof_image || null,
            sender_name,
            type,
            target_payment_details,
            status: 'PENDING'
        }

        if (type === 'TOPUP') {
            transactionData.payment_method_id = validData.payment_method_id ? Number(validData.payment_method_id) : null
        } else if (type === 'WITHDRAW') {
            transactionData.withdraw_method_id = validData.payment_method_id ? Number(validData.payment_method_id) : null
        }

        const transaction = await prisma.transaction.create({
            data: transactionData,
            include: {
                paymentMethod: true,
                withdrawMethod: true,
                user: true
            }
        })

        // 5. Notifikasi Telegram
        if (type === 'TOPUP') {
            const isGuest = !(transaction as any).user_id
            const hasProof = Boolean((transaction as any).proof_image)

            if (isGuest && !hasProof) {
                console.log(`[TELEGRAM] Menunggu upload bukti untuk transaksi guest: ${transaction.id}`)
            } else {
                sendTopupNotif({
                    id: transaction.id,
                    trxId: transaction.trx_id || String(transaction.id),
                    userName: transaction.nickname || transaction.user?.username || 'Guest',
                    accountName: transaction.sender_name || transaction.user?.account_name,
                    gameId: transaction.user_game_id || String(transaction.game_id),
                    chipAmount: transaction.amount_chip,
                    totalPrice: transaction.amount_money,
                    paymentMethod: transaction.paymentMethod?.name || 'Manual',
                    createdAt: transaction.createdAt,
                    isGuest,
                    proofImage: transaction.proof_image
                }).catch(e => console.error('Telegram TOPUP notif error:', e))
            }
        } else if (type === 'WITHDRAW') {
            sendWithdrawNotif({
                id: transaction.id,
                trxId: transaction.trx_id || String(transaction.id),
                userName: transaction.nickname || transaction.user?.username || 'Guest',
                gameId: transaction.user_game_id || String(transaction.game_id),
                chipAmount: transaction.amount_chip,
                totalPrice: transaction.amount_money,
                bankName: transaction.withdrawMethod?.name || 'Bank',
                bankAccount: transaction.target_payment_details || '-',
                bankHolder: transaction.nickname || '-',
                createdAt: transaction.createdAt,
                isGuest: !(transaction as any).user_id,
                proofImage: transaction.proof_image
            }).catch(e => console.error('Telegram WD notif error:', e))
        }

        // 6. Update Member Stats (Async)
        if (userId && type === 'TOPUP') {
            updateMemberStats(userId, Number(finalAmountChip)).catch(e => console.error('Stats update error:', e))

            if (user_game_id) {
                prisma.userGameId.findFirst({
                    where: {
                        user_id: userId,
                        game_id: Number(validData.game_id),
                        game_user_id: user_game_id
                    }
                }).then(existing => {
                    if (!existing) {
                        prisma.userGameId.create({
                            data: {
                                user_id: userId!,
                                game_id: Number(validData.game_id),
                                game_user_id: user_game_id,
                                nickname
                            }
                        }).catch(() => {})
                    }
                }).catch(() => {})
            }
        }

        return NextResponse.json(transaction)
    } catch (error) {
        console.error('Transaction create error:', error)
        return NextResponse.json({ error: 'Gagal membuat transaksi. Silakan coba kembali.' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const bank_id = searchParams.get('bank_id')
        const date = searchParams.get('date')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const search = searchParams.get('search')
        const page = Number(searchParams.get('page')) || 1
        const limit = Number(searchParams.get('limit')) || 20
        const includeStats = searchParams.get('includeStats') !== 'false'

        // PROTEKSI: Cek apakah pemanggil adalah Admin/Staff
        const adminSession = await getAdminSessionFromRequest(request)
        if (!adminSession) {
            // Jika bukan admin, hanya izinkan pencarian spesifik (misal dari halaman check-transaction) dengan limit ketat
            if (!search || search.length < 5) {
                return NextResponse.json({
                    error: 'Unauthorized: Akses daftar transaksi hanya untuk admin.'
                }, { status: 401 })
            }
        }

        const result = await getTransactions({
            status,
            type,
            bank_id,
            date,
            startDate,
            endDate,
            search,
            page,
            limit,
            includeStats
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Transaction fetch error:', error)
        return NextResponse.json({ error: 'Gagal mengambil data transaksi.' }, { status: 500 })
    }
}
