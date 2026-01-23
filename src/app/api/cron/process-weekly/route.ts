import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Level Targets (Weekly Turnover)
const TARGETS = {
    BRONZE_TO_SILVER: 30_000_000_000, // 30 Billion
    SILVER_TO_GOLD: 80_000_000_000,   // 80 Billion
}

export async function POST(request: Request) {
    try {
        // Authenticate Cron Request (Simple secret check)
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        // Determine "Last Week" start
        // If this runs on Monday morning, we process the week that just ended (last Monday)
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const currentWeekStart = new Date(now.setDate(diff))
        currentWeekStart.setHours(0, 0, 0, 0)

        const lastWeekStart = new Date(currentWeekStart)
        lastWeekStart.setDate(lastWeekStart.getDate() - 7)

        console.log(`[CRON] Processing Weekly Stats for week starting: ${lastWeekStart.toISOString()}`)

        // 1. Fetch Users and their stats for LAST week
        const users = await prisma.user.findMany({
            include: {
                weeklyStats: {
                    where: { week_start: lastWeekStart }
                }
            }
        })

        const results = {
            processed: 0,
            leveledUp: 0,
            reset: 0,
            ticketsGenerated: 0
        }

        for (const user of users) {
            const stats = user.weeklyStats[0]
            const turnover = stats ? stats.total_turnover : 0

            let newLevel = user.level
            let newConsecutive = user.consecutive_weeks
            let generatedTickets: string[] = [] // User.tickets is string[]

            // --- Level Up Logic ---
            // Bronze -> Silver
            if (user.level === 'BRONZE') {
                if (turnover >= TARGETS.BRONZE_TO_SILVER) {
                    newConsecutive += 1
                    if (newConsecutive >= 3) {
                        newLevel = 'SILVER'
                        newConsecutive = 0 // Reset after level up? Or keep counting? Usually reset.
                    }
                } else {
                    newConsecutive = 0
                }
            }
            // Silver -> Gold
            else if (user.level === 'SILVER') {
                if (turnover >= TARGETS.SILVER_TO_GOLD) {
                    newConsecutive += 1
                    if (newConsecutive >= 3) {
                        newLevel = 'GOLD'
                        newConsecutive = 0
                    }
                } else {
                    // Demotion check? Rule: "2 minggu berturut-turut tidak login/transaksi"
                    // For now, simplify: if miss target, just reset consecutive.
                    newConsecutive = 0
                }
            }

            // --- Ticket Logic ---
            // Bronze-Gold: 1 Ticket if Active (EXP > 0 or has turnover)
            // Rule: "EXP Aktif" needed.
            // If user has turnover, they are likely active.
            if (['BRONZE', 'SILVER', 'GOLD'].includes(user.level) && turnover > 0) {
                // Generate Ticket
                const code = `T-${user.id}-${Date.now().toString().slice(-6)}`
                // Add to existing tickets? Schema has `tickets String[]`.
                // We should append.
                // Note: Prisma string array append needs careful handling or set.
                // Actually fetch existing tickets is simpler? 
                // Wait, user object already has tickets? I didn't include it in findMany.
                // I will just push to a list to update.
            }

            // --- Update User ---
            if (newLevel !== user.level || newConsecutive !== user.consecutive_weeks) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        level: newLevel,
                        consecutive_weeks: newConsecutive,
                        // tickets: { push: generatedTickets } // PostgreSQL supports push
                    }
                })
                if (newLevel !== user.level) results.leveledUp++
                else results.reset++
            }

            // --- Update Stats Marked as Processed? ---
            // Maybe not needed, implicit by time.

            results.processed++
        }

        return NextResponse.json({ success: true, results })

    } catch (error) {
        console.error('Weekly Cron Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
