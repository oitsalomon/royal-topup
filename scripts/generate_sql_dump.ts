import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

function escapeSqlValue(val: any): string {
    if (val === null || val === undefined) return 'NULL'
    if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val)
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
    if (val instanceof Date) return `'${val.toISOString()}'`
    if (Array.isArray(val)) {
        const elements = val.map(v => typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : String(v)).join(',')
        return `'{${elements}}'`
    }
    if (typeof val === 'object') {
        const jsonStr = JSON.stringify(val).replace(/'/g, "''")
        return `'${jsonStr}'::jsonb`
    }
    // String escaping
    return `'${String(val).replace(/'/g, "''")}'`
}

async function generateSqlDump() {
    console.log('=== MEMULAI GENERATE SQL DUMP ASLI (POSTGRESQL) ===')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }

    const sqlFilePath = path.join(backupDir, `db_dump_${timestamp}.sql`)

    // Tables in correct foreign-key dependency order (parents first, then children)
    const tables: { name: string, model: any }[] = [
        { name: 'User', model: prisma.user },
        { name: 'Package', model: prisma.package },
        { name: 'Game', model: prisma.game },
        { name: 'PaymentMethod', model: prisma.paymentMethod },
        { name: 'GameAccount', model: prisma.gameAccount },
        { name: 'WithdrawMethod', model: prisma.withdrawMethod },
        { name: 'SystemConfig', model: prisma.systemConfig },
        { name: 'UserGameId', model: prisma.userGameId },
        { name: 'WeeklyStats', model: prisma.weeklyStats },
        { name: 'Transaction', model: prisma.transaction },
        { name: 'ActivityLog', model: prisma.activityLog },
        { name: 'Transfer', model: prisma.transfer },
        { name: 'Adjustment', model: prisma.adjustment },
        { name: 'StorePromoConfig', model: prisma.storePromoConfig },
        { name: 'PromoPackage', model: prisma.promoPackage },
        { name: 'LoyaltyLog', model: prisma.loyaltyLog },
        { name: 'LotteryTicket', model: prisma.lotteryTicket },
        { name: 'UserVoucher', model: prisma.userVoucher },
        { name: 'ReferralBonusLog', model: prisma.referralBonusLog }
    ]

    const sqlLines: string[] = [
        `-- PostgreSQL Database Dump for Royal Clover Store`,
        `-- Generated at: ${new Date().toISOString()}`,
        `-- Database URL: Supabase PostgreSQL`,
        ``,
        `BEGIN;`,
        `SET statement_timeout = 0;`,
        `SET client_encoding = 'UTF8';`,
        `-- Disable foreign key checks during import`,
        `SET session_replication_role = 'replica';`,
        ``
    ]

    let totalRows = 0

    for (const { name, model } of tables) {
        try {
            const rows = await model.findMany()
            console.log(`Table ${name}: ${rows.length} rows`)
            totalRows += rows.length

            if (rows.length === 0) continue

            sqlLines.push(`-- Table: "${name}" (${rows.length} rows)`)
            sqlLines.push(`TRUNCATE TABLE "public"."${name}" CASCADE;`)

            // Process rows in batches of 100 to keep statements reasonable
            const batchSize = 100
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize)
                const columns = Object.keys(batch[0]).map(c => `"${c}"`).join(', ')
                
                const valueRows = batch.map((row: any) => {
                    const vals = Object.values(row).map(escapeSqlValue).join(', ')
                    return `(${vals})`
                }).join(',\n')

                sqlLines.push(`INSERT INTO "public"."${name}" (${columns}) VALUES\n${valueRows};`)
            }
            sqlLines.push(``)
        } catch (err: any) {
            console.warn(`Catatan: Tabel ${name} dilewati (${err.message})`)
        }
    }

    // Add auto-increment sequence resets for all tables
    sqlLines.push(`-- Reset auto-increment sequences so new inserts won't conflict with restored IDs`)
    for (const { name } of tables) {
        sqlLines.push(`SELECT setval(pg_get_serial_sequence('"public"."${name}"', 'id'), coalesce(max(id), 1)) FROM "public"."${name}";`)
    }
    sqlLines.push(``)

    sqlLines.push(`-- Re-enable foreign key checks`)
    sqlLines.push(`SET session_replication_role = 'origin';`)
    sqlLines.push(`COMMIT;`)
    sqlLines.push(`-- Dump complete. Total rows: ${totalRows}`)

    fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf-8')
    const fileSizeMB = (fs.statSync(sqlFilePath).size / (1024 * 1024)).toFixed(2)
    console.log(`\n✅ SQL DUMP BERHASIL dibuat: ${sqlFilePath}`)
    console.log(`Ukuran file: ${fileSizeMB} MB | Total baris data: ${totalRows}`)

    return sqlFilePath
}

generateSqlDump()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
