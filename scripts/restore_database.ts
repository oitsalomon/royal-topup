import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function restore(backupFileName?: string) {
    console.log('=== MEMULAI RESTORE DATABASE ===')
    const backupDir = path.join(process.cwd(), 'backups')

    let fileToRestore = backupFileName
    if (!fileToRestore) {
        // Find latest backup
        const files = fs.readdirSync(backupDir).filter(f => f.startsWith('db_backup_') && f.endsWith('.json'))
        if (files.length === 0) {
            throw new Error('Tidak ada file backup ditemukan di folder backups/')
        }
        files.sort().reverse()
        fileToRestore = files[0]
    }

    const fullPath = path.join(backupDir, fileToRestore)
    console.log(`Memulihkan data dari file: ${fullPath}`)

    const content = fs.readFileSync(fullPath, 'utf-8')
    const parsed = JSON.parse(content)
    const { data } = parsed

    console.log(`Data ditemukan: ${data.users?.length || 0} user, ${data.transactions?.length || 0} transaksi, ${data.packages?.length || 0} paket.`)
    console.log('✅ File backup valid dan siap di-restore jika diperlukan.')
}

restore(process.argv[2])
