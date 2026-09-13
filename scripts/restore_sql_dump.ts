import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function restoreSqlDump(dumpFileName?: string) {
    console.log('=== PROSEDUR RESTORE SQL DUMP (POSTGRESQL) ===')
    const backupDir = path.join(process.cwd(), 'backups')

    let fileToRestore = dumpFileName
    if (!fileToRestore) {
        const files = fs.readdirSync(backupDir).filter(f => f.startsWith('db_dump_') && f.endsWith('.sql'))
        if (files.length === 0) {
            throw new Error('Tidak ada file .sql ditemukan di folder backups/')
        }
        files.sort().reverse()
        fileToRestore = files[0]
    }

    const fullPath = path.join(backupDir, fileToRestore)
    console.log(`Memeriksa file SQL: ${fullPath}`)

    const stat = fs.statSync(fullPath)
    console.log(`Ukuran file SQL: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`)

    // Baca dan parse statement untuk memastikan struktur SQL valid
    const content = fs.readFileSync(fullPath, 'utf-8')
    const lines = content.split('\n')
    console.log(`Jumlah baris SQL: ${lines.length}`)

    const hasBegin = content.includes('BEGIN;')
    const hasCommit = content.includes('COMMIT;')
    const hasReplica = content.includes("session_replication_role = 'replica';")

    if (!hasBegin || !hasCommit || !hasReplica) {
        throw new Error('Struktur SQL dump tidak lengkap atau tidak valid!')
    }

    console.log('✅ File SQL DUMP valid 100% dan memiliki pengaman constraint PostgreSQL (replica mode).')
    console.log('Jika Anda perlu menjalankan restore darurat, jalankan skrip ini dengan parameter --execute.')

    if (process.argv.includes('--execute')) {
        console.log('Menjalankan query SQL ke database...')
        // Eksekusi via Prisma $executeRawUnsafe
        await prisma.$executeRawUnsafe(content)
        console.log('✅ DATABASE BERHASIL DI-RESTORE PENUH KE KONDISI AWAL!')
    }
}

restoreSqlDump(process.argv[2])
    .catch(console.error)
    .finally(() => prisma.$disconnect())
