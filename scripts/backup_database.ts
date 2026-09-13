import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function backup() {
    console.log('=== MEMULAI BACKUP DATABASE LENGKAP ===')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupFilePath = path.join(backupDir, `db_backup_${timestamp}.json`)

    try {
        console.log('Mengambil data tabel...')
        const [
            users,
            transactions,
            packages,
            paymentMethods,
            gameAccounts,
            systemConfigs,
            games,
            withdrawMethods,
            userGameIds,
            weeklyStats,
            activityLogs,
            transfers,
            adjustments
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.transaction.findMany(),
            prisma.package.findMany(),
            prisma.paymentMethod.findMany(),
            prisma.gameAccount.findMany(),
            prisma.systemConfig.findMany(),
            prisma.game.findMany(),
            prisma.withdrawMethod.findMany(),
            prisma.userGameId.findMany(),
            prisma.weeklyStats.findMany(),
            prisma.activityLog.findMany(),
            prisma.transfer.findMany(),
            prisma.adjustment.findMany()
        ])

        const backupData = {
            timestamp: new Date().toISOString(),
            counts: {
                users: users.length,
                transactions: transactions.length,
                packages: packages.length,
                paymentMethods: paymentMethods.length,
                gameAccounts: gameAccounts.length,
                systemConfigs: systemConfigs.length,
                games: games.length,
                withdrawMethods: withdrawMethods.length,
                userGameIds: userGameIds.length,
                weeklyStats: weeklyStats.length,
                activityLogs: activityLogs.length,
                transfers: transfers.length,
                adjustments: adjustments.length
            },
            data: {
                users,
                transactions,
                packages,
                paymentMethods,
                gameAccounts,
                systemConfigs,
                games,
                withdrawMethods,
                userGameIds,
                weeklyStats,
                activityLogs,
                transfers,
                adjustments
            }
        }

        fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8')
        console.log(`✅ Backup BERHASIL dibuat di: ${backupFilePath}`)
        console.log(`Rincian data ter-backup:`)
        console.table(backupData.counts)

        return backupFilePath
    } catch (error) {
        console.error('❌ GAGAL melakukan backup:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

backup()
