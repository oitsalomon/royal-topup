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
        // 2. SERVER-SIDE PRICING ENFORCEMENT
        // =========================================================================
        if (type === 'TOPUP') {
            let pkg: any = null

            // Prioritas 1: Cari berdasarkan package_id di database
            if (validData.package_id) {
                pkg = await prisma.package.findUnique({
                    where: { id: Number(validData.package_id) }
                })
            }

            // Prioritas 2: Cari berdasarkan amount_chip di database
            if (!pkg && validData.amount_chip) {
                const chipM = Math.round(validData.amount_chip * 1000)
                pkg = await prisma.package.findFirst({
                    where: { chip: chipM, isActive: true }
                })
            }

            // Prioritas 3: Fallback ke standar paket jika database mengembalikan ID default
            if (!pkg) {
                const FALLBACK_PKGS = [
                    { id: 101, name: '150M', chip: 150, price: 10049 },
                    { id: 102, name: '200M', chip: 200, price: 13109 },
                    { id: 103, name: '300M', chip: 300, price: 19174 },
                    { id: 104, name: '400M', chip: 400, price: 26318 },
                    { id: 105, name: '500M', chip: 500, price: 32500 },
                    { id: 106, name: '600M', chip: 600, price: 39000 },
                    { id: 107, name: '700M', chip: 700, price: 45500 },
                    { id: 108, name: '800M', chip: 800, price: 52500 },
                    { id: 109, name: '900M', chip: 900, price: 58500 },
                    { id: 110, name: '1B', chip: 1000, price: 65010 },
                    { id: 111, name: '1.5B', chip: 1500, price: 97515 },
                    { id: 112, name: '2B', chip: 2000, price: 130020 },
                    { id: 113, name: '3B', chip: 3000, price: 195030 },
                    { id: 114, name: '4B', chip: 4000, price: 260040 },
                    { id: 115, name: '5B', chip: 5000, price: 325050 },
                    { id: 116, name: '10B', chip: 10000, price: 645010 },
                    { id: 117, name: '15B', chip: 15000, price: 967515 },
                    { id: 118, name: '20B', chip: 20000, price: 1280020 },
                    { id: 119, name: '30B', chip: 30000, price: 1920030 },
                    { id: 120, name: '40B', chip: 40000, price: 2560040 },
                    { id: 121, name: '50B', chip: 50000, price: 3150050 },
                    { id: 122, name: '75B', chip: 75000, price: 4725075 },
                    { id: 123, name: '100B', chip: 100000, price: 6290100 },
                    { id: 124, name: '150B', chip: 150000, price: 9420150 },
                ]
                const matchedFallback = FALLBACK_PKGS.find(p => 
                    p.id === Number(validData.package_id) || 
                    (validData.amount_chip && Math.round(p.chip) === Math.round(validData.amount_chip * 1000))
                )
                if (matchedFallback) {
                    pkg = matchedFallback
                }
            }

            if (pkg) {
                // Ambil Chip & Harga resmi dari paket
                finalAmountChip = pkg.chip >= 100 ? (pkg.chip / 1000) : pkg.chip // Konversi ke Billion (B)
                finalAmountMoney = Number(pkg.price) // Harga resmi server
            } else if (validData.amount_chip && validData.amount_chip > 0) {
                // Prioritas 4: Custom Top Up (input manual dari form)
                finalAmountChip = Number(validData.amount_chip)
                finalAmountMoney = validData.amount_money && Number(validData.amount_money) >= 10000
                    ? Number(validData.amount_money)
                    : Math.round(finalAmountChip * 65000)
            } else {
                return NextResponse.json({
                    error: 'Paket chip tidak valid atau sudah tidak aktif.'
                }, { status: 400 })
            }

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

        // 5. Notifikasi Telegram (Kirim real-time untuk semua transaksi, guest maupun member)
        if (type === 'TOPUP') {
            const isGuest = !(transaction as any).user_id

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
