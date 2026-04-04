// src/app/api/telegram/webhook/route.ts
// Handle tombol Approve / Decline dari Telegram

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendStatusUpdate } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Pastikan ini callback_query (tombol ditekan)
    if (!body.callback_query) {
      return NextResponse.json({ ok: true });
    }

    const { id: callbackId, data, from, message } = body.callback_query;
    const messageId = message.message_id;

    // Parse action dan trxId dari callback_data
    // Format: "approve_trxId" atau "decline_trxId"
    const [action, trxId] = data.split('_');

    if (!['approve', 'decline'].includes(action) || !trxId) {
      return NextResponse.json({ ok: true });
    }

    const newStatus = action === 'approve' ? 'SUCCESS' : 'FAILED';
    const adminName = from.first_name || 'Admin';

    // Update status transaksi di database
    const trx = await prisma.transaction.update({
      where: { id: Number(trxId) }, // Transaction ID is Int in schema.prisma
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    if (!trx) {
      // Answer callback agar loading spinner hilang
      await answerCallback(callbackId, '⚠️ Transaksi tidak ditemukan');
      return NextResponse.json({ ok: true });
    }

    // Update pesan Telegram (hapus tombol, tambah status)
    await sendStatusUpdate(
      messageId,
      trx.trx_id || trxId, // Use human readable ID
      action === 'approve' ? 'APPROVED' : 'DECLINED',
      adminName
    );

    // Answer callback
    const answerText =
      action === 'approve'
        ? '✅ Transaksi disetujui!'
        : '❌ Transaksi ditolak';
    await answerCallback(callbackId, answerText);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Selalu return 200 ke Telegram
  }
}

// Answer callback query (hilangkan loading spinner di tombol)
async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false,
      }),
    }
  );
}
