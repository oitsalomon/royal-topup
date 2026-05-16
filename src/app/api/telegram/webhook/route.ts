// src/app/api/telegram/webhook/route.ts
// Handle tombol Approve / Decline dari Telegram
// Full 2-stage flow — identik dengan web dashboard

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendStatusUpdate } from '@/lib/telegram'
import { updateMemberStats, awardLoyaltyPoints } from '@/services/member'
import { processReferralBonus, reverseReferralBonus } from '@/services/referral'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Hanya proses callback_query (tombol ditekan)
    if (!body.callback_query) {
      return NextResponse.json({ ok: true })
    }

    const { id: callbackId, data, from, message } = body.callback_query
    const messageId = message.message_id
    const adminName = from.first_name || 'Admin'

    // Parse action dan trxId dari callback_data
    // Format: "approve_<id>" atau "decline_<id>"
    const underscoreIdx = data.indexOf('_')
    if (underscoreIdx === -1) return NextResponse.json({ ok: true })
    const action = data.slice(0, underscoreIdx)
    const trxId = data.slice(underscoreIdx + 1)

    if (!['approve', 'decline'].includes(action) || !trxId) {
      return NextResponse.json({ ok: true })
    }

    const transactionId = Number(trxId)
    if (isNaN(transactionId)) return NextResponse.json({ ok: true })

    // Ambil transaksi dari database
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      await answerCallback(callbackId, '⚠️ Transaksi tidak ditemukan')
      return NextResponse.json({ ok: true })
    }

    // Blokir jika sudah final
    if (['APPROVED_2', 'DECLINED'].includes(transaction.status)) {
      await answerCallback(callbackId, `⚠️ Transaksi sudah final: ${transaction.status}`)
      return NextResponse.json({ ok: true })
    }

    const humanTrxId = transaction.trx_id || String(transactionId)

    if (action === 'decline') {
      // ── DECLINE ──────────────────────────────────────────────
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'DECLINED' },
        })

        // Jika sudah APPROVED_2 sebelumnya, balikkan referral bonus
        if (transaction.status === 'APPROVED_2') {
          await reverseReferralBonus(transactionId, tx)
        }

        // Refund balance_bonus jika REFERRAL_WD
        if (transaction.type === 'REFERRAL_WD' && transaction.user_id) {
          await tx.user.update({
            where: { id: transaction.user_id },
            data: {
              balance_bonus: { increment: transaction.amount_money },
              wd_bonus_this_week: false,
            },
          })
        }
      })

      await sendStatusUpdate(messageId, humanTrxId, 'DECLINED', adminName)
      await answerCallback(callbackId, '❌ Transaksi ditolak')
    } else {
      // ── APPROVE (full 2-stage) ───────────────────────────────
      await approveFullTransaction(transaction)

      await sendStatusUpdate(messageId, humanTrxId, 'APPROVED', adminName)
      await answerCallback(callbackId, '✅ Transaksi disetujui!')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Selalu return 200 ke Telegram
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Full 2-stage approval — logika sama persis dengan /api/transactions/[id]/approve
// ─────────────────────────────────────────────────────────────────────────────
async function approveFullTransaction(transaction: {
  id: number
  type: string
  status: string
  game_id: number
  user_id: number | null
  payment_method_id: number | null
  withdraw_method_id: number | null
  amount_chip: number
  amount_money: number
  trx_id: string | null
}) {
  const trxId = transaction.id

  if (transaction.type === 'TOPUP') {
    // ── STAGE 1: Uang diterima → tambah saldo bank ─────────────
    if (transaction.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: trxId },
          data: { status: 'APPROVED_1' },
        })
        if (transaction.payment_method_id) {
          await tx.paymentMethod.update({
            where: { id: transaction.payment_method_id },
            data: { balance: { increment: transaction.amount_money } },
          })
        }
      })
    }

    // ── STAGE 2: Chip dikirim → kurangi saldo game account ─────
    // Auto-pilih game account dengan saldo tertinggi untuk game ini
    const gameAccount = await prisma.gameAccount.findFirst({
      where: { game_id: transaction.game_id, isActive: true },
      orderBy: { balance: 'desc' },
    })

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: trxId },
        data: { status: 'APPROVED_2' },
      })

      if (gameAccount) {
        await tx.gameAccount.update({
          where: { id: gameAccount.id },
          data: { balance: { decrement: transaction.amount_chip } },
        })
      }

      // Update member stats, loyalty points, dan referral bonus
      if (transaction.user_id) {
        await updateMemberStats(transaction.user_id, transaction.amount_chip, tx)
        await awardLoyaltyPoints(transaction.user_id, transaction.amount_money, tx)
        await processReferralBonus(trxId, tx)
      }
    })

  } else if (transaction.type === 'WITHDRAW') {
    // ── STAGE 1: Chip diterima → tambah saldo game account ─────
    if (transaction.status === 'PENDING') {
      const gameAccount = await prisma.gameAccount.findFirst({
        where: { game_id: transaction.game_id, isActive: true },
        orderBy: { balance: 'asc' }, // pilih akun dengan chip paling sedikit
      })

      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: trxId },
          data: { status: 'APPROVED_1' },
        })
        if (gameAccount) {
          await tx.gameAccount.update({
            where: { id: gameAccount.id },
            data: { balance: { increment: transaction.amount_chip } },
          })
        }
      })
    }

    // ── STAGE 2: Uang dikirim → kurangi saldo bank ─────────────
    // Auto-pilih bank dengan saldo mencukupi
    const bank = await prisma.paymentMethod.findFirst({
      where: {
        isActive: true,
        balance: { gte: transaction.amount_money },
      },
      orderBy: { balance: 'desc' },
    })

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: trxId },
        data: { status: 'APPROVED_2' },
      })
      if (bank) {
        await tx.paymentMethod.update({
          where: { id: bank.id },
          data: { balance: { decrement: transaction.amount_money } },
        })
      }
    })

  } else if (transaction.type === 'REFERRAL_WD') {
    // ── STAGE 1: Validasi ───────────────────────────────────────
    if (transaction.status === 'PENDING') {
      await prisma.transaction.update({
        where: { id: trxId },
        data: { status: 'APPROVED_1' },
      })
    }

    // ── STAGE 2: Uang dikirim → kurangi saldo bank ─────────────
    const bank = await prisma.paymentMethod.findFirst({
      where: {
        isActive: true,
        balance: { gte: transaction.amount_money },
      },
      orderBy: { balance: 'desc' },
    })

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: trxId },
        data: { status: 'APPROVED_2' },
      })
      if (bank) {
        await tx.paymentMethod.update({
          where: { id: bank.id },
          data: { balance: { decrement: transaction.amount_money } },
        })
      }
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Answer callback query (hilangkan loading spinner di tombol Telegram)
// ─────────────────────────────────────────────────────────────────────────────
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
  )
}
