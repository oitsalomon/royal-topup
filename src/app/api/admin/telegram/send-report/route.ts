import { NextResponse } from 'next/server'
import { sendCustomMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { text, htmlText } = body

        const messageContent = htmlText || text
        if (!messageContent || !messageContent.trim()) {
            return NextResponse.json({ error: 'Teks laporan tidak boleh kosong' }, { status: 400 })
        }

        const parseMode = htmlText ? 'HTML' : 'Markdown'
        const result = await sendCustomMessage(messageContent, parseMode)

        if (result && result.ok) {
            return NextResponse.json({
                success: true,
                message: 'Laporan berhasil dikirim ke grup Telegram',
                result
            })
        } else {
            console.error('Telegram API responded with error:', result)
            return NextResponse.json({
                success: false,
                error: result?.description || 'Gagal mengirim laporan ke Telegram',
                details: result
            }, { status: 502 })
        }
    } catch (error: any) {
        console.error('Error sending Telegram report:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
