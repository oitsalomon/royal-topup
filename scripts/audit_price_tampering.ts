import { prisma } from '../src/lib/prisma'

async function auditTransactions() {
    console.log('=== AUDIT POTENSI MANIPULASI HARGA (PRICE TAMPERING) ===\n')

    // 1. Ambil seluruh paket acuan
    const packages = await prisma.package.findMany()
    const packageMap = new Map<number, { chip: number, price: number, name: string }>()
    packages.forEach(p => {
        packageMap.set(p.chip, { chip: p.chip, price: p.price, name: p.name })
    })

    console.log(`Daftar paket resmi yang tercatat di database: ${packages.length} paket.`)

    // 2. Ambil seluruh transaksi TOPUP yang sukses atau approved
    const topupTransactions = await prisma.transaction.findMany({
        where: {
            type: 'TOPUP'
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    console.log(`Total transaksi TOPUP yang diperiksa: ${topupTransactions.length} transaksi.\n`)

    const anomalies: any[] = []

    for (const tx of topupTransactions) {
        // Cari paket yang paling pas dengan amount_chip
        const matchingPkg = packageMap.get(tx.amount_chip)

        if (matchingPkg) {
            // Toleransi kode unik QRIS (1 - 250 rupiah)
            const minAllowed = matchingPkg.price - 500
            const maxAllowed = matchingPkg.price + 500

            // Cek apakah bayar jauh di bawah harga seharusnya (misal diskon palsu atau manipulasi Rp 1000)
            if (tx.amount_money < minAllowed) {
                const selisih = matchingPkg.price - tx.amount_money
                anomalies.push({
                    id: tx.id,
                    trx_id: tx.trx_id,
                    createdAt: tx.createdAt,
                    user_wa: tx.user_wa,
                    user_game_id: tx.user_game_id,
                    nickname: tx.nickname,
                    status: tx.status,
                    chip: `${tx.amount_chip}M`,
                    harga_asli: matchingPkg.price,
                    bayar_client: tx.amount_money,
                    selisih_rugi: selisih,
                    keterangan: `Bayar Rp ${tx.amount_money.toLocaleString('id-ID')} padahal harga resmi Rp ${matchingPkg.price.toLocaleString('id-ID')}`
                })
            }
        } else {
            // Jika chip tidak cocok dengan paket apa pun
            // Hitung rate per 1B (1000M): harga pasaran normal adalah 60rb - 65rb per 1B
            const ratePer1B = tx.amount_chip > 0 ? (tx.amount_money / (tx.amount_chip / 1000)) : 0
            if (ratePer1B < 50000 && tx.amount_chip >= 500) {
                anomalies.push({
                    id: tx.id,
                    trx_id: tx.trx_id,
                    createdAt: tx.createdAt,
                    user_wa: tx.user_wa,
                    user_game_id: tx.user_game_id,
                    nickname: tx.nickname,
                    status: tx.status,
                    chip: `${tx.amount_chip}M`,
                    harga_asli: 'Custom',
                    bayar_client: tx.amount_money,
                    selisih_rugi: 0,
                    keterangan: `Rate sangat rendah: Rp ${Math.round(ratePer1B).toLocaleString('id-ID')} / 1B`
                })
            }
        }
    }

    if (anomalies.length === 0) {
        console.log('✅ HASIL AUDIT BERSIH: Tidak ditemukan satupun transaksi dengan anomali harga mencurigakan atau celah tampering di riwayat transaksi!')
    } else {
        console.log(`⚠️ PERINGATAN: Ditemukan ${anomalies.length} transaksi yang perlu diinvestigasi:`)
        console.table(anomalies.slice(0, 20))
    }

    await prisma.$disconnect()
}

auditTransactions()
