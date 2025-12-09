import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import defaultConfig from '../../../../config.json' // Fallback initial config

const CONFIG_KEY = 'main_config'

export async function GET() {
    try {
        const configRecord = await prisma.systemConfig.findUnique({
            where: { key: CONFIG_KEY }
        })

        if (!configRecord) {
            // First run: Seed from JSON file to DB
            const newConfig = await prisma.systemConfig.create({
                data: {
                    key: CONFIG_KEY,
                    value: defaultConfig as any
                }
            })
            return NextResponse.json(newConfig.value)
        }

        return NextResponse.json(configRecord.value)
    } catch (error) {
        console.error('Config Fetch Error:', error)
        // Fallback to default config if DB fails, to prevent crash
        return NextResponse.json(defaultConfig)
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const user_id = 1 // Default Admin ID for now (TODO: Get from session)

        // 1. Get Current Config for comparison (Optional, skipped for speed)

        // 2. Upsert Config to DB
        const updatedConfig = await prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            update: { value: body },
            create: {
                key: CONFIG_KEY,
                value: body
            }
        })

        // 3. Create Audit Log
        await prisma.activityLog.create({
            data: {
                user_id: user_id,
                action: 'UPDATE_CONFIG',
                details: 'Updated system settings via Admin Panel',
                ip_address: '127.0.0.1' // Can grab from headers if needed
            }
        })

        return NextResponse.json(updatedConfig.value)
    } catch (error) {
        console.error('Config Update Error:', error)
        return NextResponse.json({ error: 'Failed to update config in DB' }, { status: 500 })
    }
}
