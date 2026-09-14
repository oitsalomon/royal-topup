import { NextResponse } from 'next/server'
import { sendPaymentAlert } from '@/lib/telegram'

// Simple in-memory throttle to prevent spamming Telegram
const recentAlerts = new Map<string, number>()

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { reason, packageName, packageId, price } = body

        const key = `${packageId || 'global'}_${reason || 'missing'}`
        const now = Date.now()
        const lastSent = recentAlerts.get(key) || 0

        // Throttle to max 1 alert per 60 seconds per key
        if (now - lastSent < 60000) {
            return NextResponse.json({ success: true, throttled: true })
        }

        recentAlerts.set(key, now)

        // Clean up old entries
        if (recentAlerts.size > 100) {
            for (const [k, time] of recentAlerts.entries()) {
                if (now - time > 120000) recentAlerts.delete(k)
            }
        }

        await sendPaymentAlert({
            reason: reason || 'QRIS tidak tersedia dan fallback toko mati/tanpa gambar',
            packageName,
            packageId,
            price: Number(price) || undefined
        }).catch(err => console.error('Telegram alert send error:', err))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Payment alert API error:', error)
        return NextResponse.json({ error: 'Failed to dispatch alert' }, { status: 500 })
    }
}
