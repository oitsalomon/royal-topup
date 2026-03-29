// src/lib/telegram.ts
// Helper untuk kirim notif ke Telegram

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Format angka ke Rupiah
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format chip (m / B)
function formatChip(amount: number): string {
  if (amount >= 1_000_000_000) return `${amount / 1_000_000_000}B`;
  if (amount >= 1_000_000) return `${amount / 1_000_000}m`;
  return `${amount}`;
}

// Kirim notif order BARU (TOPUP)
export async function sendTopupNotif(trx: {
  id: string | number;
  trxId: string;
  userName: string;
  gameId: string;
  chipAmount: number;
  totalPrice: number;
  paymentMethod: string;
  uniqueCode?: number;
  createdAt: Date;
  isGuest?: boolean;
  proofImage?: string | null;
  accountName?: string | null;
}) {
  const total = trx.uniqueCode
    ? trx.totalPrice + trx.uniqueCode
    : trx.totalPrice;

  const header = trx.isGuest 
    ? `⚠️ <b>ORDER BARU — BELI CHIP (NON-MEMBER)</b>`
    : `🔔 <b>ORDER BARU — BELI CHIP</b>`;

  const text =
    `${header}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 TRX: <code>${trx.trxId}</code>\n` +
    `👤 User: <b>${trx.userName}</b>\n` +
    (trx.accountName ? `💳 Pengirim: <b>${trx.accountName}</b>\n` : '') +
    `🎮 ID Game: <code>${trx.gameId}</code>\n` +
    `💎 Chip: <b>${formatChip(trx.chipAmount)}</b>\n` +
    `💰 Total: <b>${formatRupiah(total)}</b>\n` +
    (trx.uniqueCode ? `🔢 Kode Unik: <b>+${trx.uniqueCode}</b>\n` : '') +
    `🏦 Metode: <b>${trx.paymentMethod}</b>\n` +
    `🕐 Waktu: ${trx.createdAt.toLocaleString('id-ID')}\n` +
    `━━━━━━━━━━━━━━━━━━━━`;

  const inline_keyboard = [
    [
      { text: '✅ Approve', callback_data: `approve_${trx.id}` },
      { text: '❌ Decline', callback_data: `decline_${trx.id}` },
    ],
  ];

  if (trx.proofImage) {
      return sendPhoto(trx.proofImage, text, inline_keyboard);
  }

  return sendMessage(text, inline_keyboard);
}

// Kirim notif order BARU (WITHDRAW)
export async function sendWithdrawNotif(trx: {
  id: string | number;
  trxId: string;
  userName: string;
  gameId: string;
  chipAmount: number;
  totalPrice: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  createdAt: Date;
  isGuest?: boolean;
}) {
  const header = trx.isGuest 
    ? `💸 <b>REQUEST WD — JUAL CHIP (NON-MEMBER)</b>`
    : `💸 <b>REQUEST WD — JUAL CHIP</b>`;

  const text =
    `${header}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 TRX: <code>${trx.trxId}</code>\n` +
    `👤 User: <b>${trx.userName}</b>\n` +
    `🎮 ID Game: <code>${trx.gameId}</code>\n` +
    `💎 Chip: <b>${formatChip(trx.chipAmount)}</b>\n` +
    `💰 Nilai: <b>${formatRupiah(trx.totalPrice)}</b>\n` +
    `🏦 Tujuan: <b>${trx.bankName}</b>\n` +
    `💳 No. Rek: <code>${trx.bankAccount}</code>\n` +
    `👨 Atas Nama: <b>${trx.bankHolder}</b>\n` +
    `🕐 Waktu: ${trx.createdAt.toLocaleString('id-ID')}\n` +
    `━━━━━━━━━━━━━━━━━━━━`;

  const inline_keyboard = [
    [
      { text: '✅ Approve WD', callback_data: `approve_${trx.id}` },
      { text: '❌ Decline WD', callback_data: `decline_${trx.id}` },
    ],
  ];

  return sendMessage(text, inline_keyboard);
}

// Kirim pesan update status
export async function sendStatusUpdate(
  messageId: number,
  trxId: string | number,
  status: 'APPROVED' | 'DECLINED',
  adminName: string
) {
  const icon = status === 'APPROVED' ? '✅' : '❌';
  const label = status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK';

  const text = `${icon} <b>Transaksi ${label}</b>\nID: <code>${trxId}</code>\nOleh: ${adminName}`;

  // Edit pesan original (hapus tombol)
  try {
    await fetch(`${BASE_URL}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      }),
    });
  } catch (e) {
    console.error('Failed to edit message reply markup:', e);
  }

  return sendMessage(text, []);
}

// Base function kirim pesan
async function sendMessage(
  text: string,
  inline_keyboard: { text: string; callback_data: string }[][]
) {
  const body: Record<string, unknown> = {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML',
  };

  if (inline_keyboard.length > 0) {
    body.reply_markup = { inline_keyboard };
  }

  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data; 
}

// Kirim Photo dengan Caption
async function sendPhoto(
  photoUrl: string,
  caption: string,
  inline_keyboard: { text: string; callback_data: string }[][]
) {
  const body: Record<string, unknown> = {
    chat_id: CHAT_ID,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  };

  if (inline_keyboard.length > 0) {
    body.reply_markup = { inline_keyboard };
  }

  const res = await fetch(`${BASE_URL}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data;
}
