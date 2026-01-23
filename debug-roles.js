
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.groupBy({
        by: ['role'],
        _count: true
    })
    console.log('--- USER ROLES DISTRIBUTION ---')
    console.log(users)

    const adminLogs = await prisma.activityLog.count({
        where: { user: { role: { in: ['ADMIN', 'CS', 'SUPER_ADMIN'] } } }
    })
    const memberLogs = await prisma.activityLog.count({
        where: { user: { role: 'VIEWER' } }
    })

    console.log('Logs by Filter:')
    console.log(`- Staff Logs: ${adminLogs}`)
    console.log(`- Member Logs: ${memberLogs}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
