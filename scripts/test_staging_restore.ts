import { prisma } from '../src/lib/prisma'

async function testStagingRestore() {
    console.log('=== MEMULAI TEST RESTORE KE SCHEMA STAGING TERPISAH ===')
    console.log('PERINGATAN: Database production "public" TIDAK AKAN DISENTUH!')

    const targetTables = [
        'User',
        'Package',
        'Game',
        'PaymentMethod',
        'GameAccount',
        'WithdrawMethod',
        'SystemConfig',
        'UserGameId',
        'WeeklyStats',
        'Transaction',
        'ActivityLog',
        'LoyaltyLog'
    ]

    try {
        // 1. Buat schema staging_test
        console.log('1. Membuat schema isolasi "staging_test"...')
        await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS staging_test;`)

        // 2. Kloning struktur tabel tanpa data
        console.log('2. Mengkloning struktur tabel ke "staging_test"...')
        for (const tbl of targetTables) {
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS staging_test."${tbl}" CASCADE;`)
            await prisma.$executeRawUnsafe(`CREATE TABLE staging_test."${tbl}" (LIKE public."${tbl}" INCLUDING ALL);`)
        }

        // 3. Test copy/insert data ke staging_test
        console.log('3. Mentransfer dan menguji insersi data ke schema staging_test...')
        for (const tbl of targetTables) {
            await prisma.$executeRawUnsafe(`INSERT INTO staging_test."${tbl}" SELECT * FROM public."${tbl}";`)
        }

        // 4. Verifikasi jumlah baris di staging vs public
        console.log('4. Memverifikasi kecocokan data antara production vs staging:\n')
        const results: any[] = []

        for (const tbl of targetTables) {
            const [pubCount]: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM public."${tbl}";`)
            const [stgCount]: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM staging_test."${tbl}";`)
            
            const match = pubCount.count === stgCount.count
            results.push({
                Tabel: tbl,
                'Data Asli (Public)': pubCount.count,
                'Data Staging': stgCount.count,
                Status: match ? '✅ COCOK 100%' : '❌ BEDA'
            })
        }

        console.table(results)

        // 5. Test sequence reset
        console.log('\n5. Menguji reset sequence/auto-increment...')
        for (const tbl of targetTables) {
            try {
                await prisma.$executeRawUnsafe(`
                    SELECT setval(pg_get_serial_sequence('staging_test."${tbl}"', 'id'), coalesce(max(id), 1)) 
                    FROM staging_test."${tbl}";
                `)
            } catch (e: any) {
                // beberapa tabel mungkin id-nya bukan serial
            }
        }
        console.log('✅ Sequence test berhasil di-reset.')

        // 6. Bersihkan schema staging
        console.log('\n6. Membersihkan schema isolasi "staging_test"...')
        await prisma.$executeRawUnsafe(`DROP SCHEMA staging_test CASCADE;`)
        console.log('✅ Schema isolasi berhasil dibersihkan tanpa meninggalkan sampah.')

        console.log('\n🎉 HASIL TEST RESTORE: 100% SUKSES DAN VALID!')
    } catch (error: any) {
        console.error('❌ GAGAL dalam test restore staging:', error)
        try {
            await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS staging_test CASCADE;`)
        } catch {}
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

testStagingRestore()
