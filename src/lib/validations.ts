import { z } from 'zod'

/**
 * Sanitasi string untuk mencegah Stored XSS
 */
export function sanitizeText(str: string): string {
    if (!str || typeof str !== 'string') return ''
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim()
}

/**
 * Validasi Nomor WhatsApp Indonesia (08... atau 628... 10-15 digit)
 */
export const indonesianPhoneRegex = /^(?:(?:\+|00)?62|0)[8][1-9]\d{7,11}$/

/**
 * Schema pembuatan transaksi baru (TOPUP & WITHDRAW)
 */
export const createTransactionSchema = z.object({
    user_wa: z.string()
        .min(10, 'Nomor WhatsApp minimal 10 digit')
        .max(16, 'Nomor WhatsApp maksimal 16 digit')
        .regex(indonesianPhoneRegex, 'Format nomor WhatsApp tidak valid (Gunakan format 08xxxxxxxxxx atau 628xxxxxxxxxx)'),
    game_id: z.number().int().positive().default(1),
    user_game_id: z.string()
        .min(4, 'ID Game minimal 4 karakter')
        .max(20, 'ID Game maksimal 20 karakter')
        .regex(/^[a-zA-Z0-9_-]+$/, 'ID Game hanya boleh huruf, angka, atau dash'),
    nickname: z.string().min(1, 'Nickname wajib diisi').max(50, 'Nickname maksimal 50 karakter'),
    package_id: z.number().int().positive({ message: 'Package ID wajib valid untuk transaksi top up' }).optional(),
    amount_chip: z.number().positive().optional(),
    amount_money: z.number().optional(), // Diabaikan oleh backend, tapi diizinkan di schema agar tidak crash
    payment_method_id: z.number().int().positive().optional().nullable(),
    proof_image: z.string().optional().nullable(),
    sender_name: z.string().max(100).optional().nullable(),
    type: z.enum(['TOPUP', 'WITHDRAW', 'REFERRAL_WD']).default('TOPUP'),
    target_payment_details: z.string().max(255).optional().nullable(),
    user_id: z.number().int().positive().optional().nullable()
})

/**
 * Schema login admin & member
 */
export const loginSchema = z.object({
    username: z.string().min(2, 'Username minimal 2 karakter').max(50, 'Username maksimal 50 karakter'),
    password: z.string().min(3, 'Password minimal 3 karakter').max(100, 'Password maksimal 100 karakter')
})
