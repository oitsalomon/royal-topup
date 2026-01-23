import { prisma } from '@/lib/prisma'
import defaultConfig from '../../config.json'

const CONFIG_KEY = 'main_config'

export async function getSystemConfig() {
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
            return newConfig.value
        }

        return configRecord.value
    } catch (error) {
        console.error('Config Fetch Error:', error)
        // Fallback to default config if DB fails
        return defaultConfig
    }
}

export async function updateSystemConfig(newConfig: any, userId: number) {
    try {
        const updatedConfig = await prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            update: { value: newConfig },
            create: {
                key: CONFIG_KEY,
                value: newConfig
            }
        })

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_CONFIG',
                details: 'Updated system settings'
            }
        })

        return updatedConfig.value
    } catch (error) {
        console.error('Config Update Error:', error)
        throw new Error('Failed to update config')
    }
}
