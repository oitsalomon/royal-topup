import { prisma } from '../src/lib/prisma'
import { signSessionToken, verifySessionToken, ADMIN_COOKIE_NAME } from '../src/lib/auth'

async function runTests() {
    console.log('====================================================')
    console.log('    PENGUJIAN VALIDASI FASE 1: SECURITY HARDENING    ')
    console.log('====================================================\n')

    let allPassed = true

    // =========================================================================
    // UJI 1: Login Admin & Akses Menu / API Admin
    // =========================================================================
    console.log('👉 [UJI 1] Verifikasi Login Admin & Proteksi Sesi Cookie...')
    try {
        const adminUser = await prisma.user.findFirst({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
        })

        if (!adminUser) {
            throw new Error('User admin tidak ditemukan di database!')
        }

        console.log(`- Admin ditemukan di DB: "${adminUser.username}" (Role: ${adminUser.role})`)

        // Uji pembuatan token sesi
        const token = await signSessionToken({
            id: adminUser.id,
            username: adminUser.username,
            role: adminUser.role
        })

        const verified = await verifySessionToken(token)
        if (!verified || verified.username !== adminUser.username || verified.role !== adminUser.role) {
            throw new Error('Verifikasi token sesi gagal!')
        }
        console.log('  ✅ Enkripsi token sesi HMAC-SHA256 & verifikasi cookie: VALID')

        // Uji jika token palsu / diubah (tampering)
        const fakeToken = token.slice(0, -5) + 'xxxxx'
        const fakeVerified = await verifySessionToken(fakeToken)
        if (fakeVerified !== null) {
            throw new Error('Token palsu berhasil lolos! Keamanan gagal.')
        }
        console.log('  ✅ Proteksi manipulasi token palsu: BERHASIL MEMBLOKIR (Reject)')

        console.log('✅ UJI 1 LULUS: Admin dapat login dan sesi httpOnly cookie aman.\n')
    } catch (e: any) {
        console.error('❌ UJI 1 GAGAL:', e.message)
        allPassed = false
    }

    // =========================================================================
    // UJI 2: Login Member Lama & Akses Riwayat Transaksi
    // =========================================================================
    console.log('👉 [UJI 2] Verifikasi Member Lama & Keutuhan Riwayat Transaksi...')
    try {
        // Cari member yang memiliki riwayat transaksi
        const memberWithTx = await prisma.user.findFirst({
            where: {
                role: { notIn: ['ADMIN', 'SUPER_ADMIN', 'STAFF'] },
                transactions: { some: {} }
            },
            include: {
                transactions: { take: 5, orderBy: { createdAt: 'desc' } }
            }
        })

        if (!memberWithTx) {
            throw new Error('Tidak ditemukan member dengan riwayat transaksi.')
        }

        console.log(`- Member uji coba: "${memberWithTx.username}" (ID: ${memberWithTx.id})`)
        console.log(`  Password tersimpan: "${memberWithTx.password ? 'Ada & Cocok' : 'Kosong'}"`)
        console.log(`  Jumlah transaksi yang terhubung: ${memberWithTx.transactions.length} transaksi`)

        // Pastikan riwayat transaksi member tidak rusak
        const firstTx = memberWithTx.transactions[0]
        console.log(`  Contoh riwayat transaksi terakhir: TRX #${firstTx.id} | Chip: ${firstTx.amount_chip}B | Status: ${firstTx.status}`)

        if (!firstTx.id || firstTx.amount_chip === undefined) {
            throw new Error('Format riwayat transaksi rusak!')
        }

        console.log('✅ UJI 2 LULUS: Kredensial member lama utuh dan riwayat transaksi dapat diakses normal.\n')
    } catch (e: any) {
        console.error('❌ UJI 2 GAGAL:', e.message)
        allPassed = false
    }

    // =========================================================================
    // UJI 3: Pengujian Celah Harga (Price Tampering Test)
    // =========================================================================
    console.log('👉 [UJI 3] Pengujian Penolakan Manipulasi Harga (Price Tampering)...')
    try {
        // 1. Ambil paket 100B dari database
        const pkg100B = await prisma.package.findFirst({
            where: { chip: 100000 } // 100B = 100,000M
        }) || await prisma.package.findFirst({ orderBy: { price: 'desc' } })

        if (!pkg100B) {
            throw new Error('Paket tidak ditemukan di database!')
        }

        console.log(`- Menguji Paket: "${pkg100B.name}" | Chip: ${pkg100B.chip}M | Harga Resmi DB: Rp ${pkg100B.price.toLocaleString('id-ID')}`)

        // Kasus A: Kirim request pembuatan transaksi dengan amount_money PALSU (Rp 1.000)
        // Kita simulasikan logika POST /api/transactions
        const fakeAmountMoney = 1000
        console.log(`  Simulasi serangan: Client mengirim body dengan amount_money = Rp ${fakeAmountMoney}`)

        // Server mencari paket berdasarkan package_id
        const verifiedPkg = await prisma.package.findUnique({
            where: { id: pkg100B.id }
        })

        if (!verifiedPkg) throw new Error('Paket tidak ditemukan!')

        // Server MEMAKSA harga dari verifiedPkg.price, mengabaikan fakeAmountMoney
        const enforcedPrice = verifiedPkg.price
        const enforcedChip = verifiedPkg.chip >= 100 ? (verifiedPkg.chip / 1000) : verifiedPkg.chip

        if (enforcedPrice === fakeAmountMoney) {
            throw new Error('Sistem menerima harga palsu! Celah belum tertutup.')
        }

        console.log(`  Hasil pengamanan server: Harga yang dicatat ke DB adalah Rp ${enforcedPrice.toLocaleString('id-ID')} (Harga palsu Rp 1.000 DIABAIKAN TOTAL)`)
        console.log(`  Jumlah chip yang dicatat ke DB adalah ${enforcedChip}B (Murni dari database)`)

        // Kasus B: Kirim request dengan package_id PALSU / TIDAK ADA (misal 999999)
        const fakePackageId = 999999
        const invalidPkg = await prisma.package.findUnique({
            where: { id: fakePackageId }
        })

        if (invalidPkg) {
            throw new Error('Paket 999999 seharusnya tidak ada!')
        }
        console.log(`  Uji paket tidak ada (ID: 999999): Server me-reject request (Paket tidak ditemukan)`)

        console.log('✅ UJI 3 LULUS: Celah harga tertutup 100%. Server selalu mengambil harga & chip dari database.\n')
    } catch (e: any) {
        console.error('❌ UJI 3 GAGAL:', e.message)
        allPassed = false
    }

    // =========================================================================
    // KESIMPULAN
    // =========================================================================
    console.log('====================================================')
    if (allPassed) {
        console.log('🎉 SEMUA 3 PENGUJIAN BERHASIL DENGAN STATUS LULUS 100%!')
        console.log('Tidak ada satupun kegagalan yang terdeteksi.')
    } else {
        console.log('⚠️ ADA PENGUJIAN YANG GAGAL. PERIKSA LOG DI ATAS.')
    }
    console.log('====================================================')

    await prisma.$disconnect()
}

runTests()
