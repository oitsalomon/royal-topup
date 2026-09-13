import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function importMembers() {
    console.log('--- Fast Non-Destructive Member Import ---')
    const jsonPath = path.join(process.cwd(), 'src/data/all_members_database.json')

    if (!fs.existsSync(jsonPath)) {
        console.error('File not found:', jsonPath)
        return
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const members = JSON.parse(raw)
    console.log(`Loaded ${members.length} members from JSON.`)

    // 1. Fetch all existing users in 1 single fast query
    console.log('Fetching existing users from database...')
    const existingUsers = await prisma.user.findMany({
        select: { id: true, username: true, whatsapp: true }
    })
    console.log(`Found ${existingUsers.length} existing users in database.`)

    const existingWAs = new Set(existingUsers.map(u => u.whatsapp).filter(Boolean))
    const existingUsernames = new Set(existingUsers.map(u => u.username).filter(Boolean))

    const toInsert: any[] = []
    const seenNewWAs = new Set<string>()
    const seenNewUsernames = new Set<string>()

    for (const m of members) {
        const wa = String(m.wa || '').trim()
        if (!wa) continue

        const username = `wa_${wa}`
        if (existingWAs.has(wa) || existingUsernames.has(username) || seenNewWAs.has(wa) || seenNewUsernames.has(username)) {
            continue // Skip without overwriting existing accounts
        }

        seenNewWAs.add(wa)
        seenNewUsernames.add(username)

        const nick = m.nick && m.nick !== '—' ? String(m.nick).trim() : `Member ${wa.slice(-4)}`
        const topNom = Number(m.top_nom || 0)

        const level =
            topNom >= 50000000
                ? 'DIAMOND'
                : topNom >= 15000000
                ? 'GOLD'
                : topNom >= 2000000
                ? 'SILVER'
                : 'BRONZE'

        toInsert.push({
            username,
            whatsapp: wa,
            account_name: nick,
            password: 'pbkdf2:sha256:imported_member_hash',
            role: 'VIEWER',
            level: level as any,
            isActive: true,
            balance_money: 0,
            balance_chip: 0
        })
    }

    console.log(`Prepared ${toInsert.length} new members to insert (no duplicates, no overwrite).`)

    if (toInsert.length > 0) {
        // Chunk into batches of 200 for safe SQL size
        const chunkSize = 200
        let insertedTotal = 0

        for (let i = 0; i < toInsert.length; i += chunkSize) {
            const chunk = toInsert.slice(i, i + chunkSize)
            const res = await prisma.user.createMany({
                data: chunk,
                skipDuplicates: true
            })
            insertedTotal += res.count
            console.log(`Inserted chunk: ${insertedTotal} / ${toInsert.length}...`)
        }

        console.log(`Successfully inserted ${insertedTotal} members into PostgreSQL!`)
    } else {
        console.log('All members are already up to date.')
    }

    console.log('--- Finished Fast Member Import ---')
}

importMembers()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
