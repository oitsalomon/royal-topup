import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        let { username, password } = body

        // Normalize Input
        username = username?.trim()
        password = password?.trim()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
        }

        // 1. Try Exact Match First (Fastest)
        let user = await prisma.user.findFirst({
            where: { username: { equals: username } } // Default is usually case sensitive depending on Collation
        })

        // 2. If not found, try Case-Insensitive Match (Postgres ILIKE behavior via mode: insensitive)
        if (!user) {
            user = await prisma.user.findFirst({
                where: { username: { equals: username, mode: 'insensitive' } }
            })
        }

        // Verify password (Exact Match Required for Security)
        // Check for both exact match AND potential whitespace variants if critical
        if (!user || user.password !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Akun dinonaktifkan. Hubungi Super Admin.' }, { status: 403 })
        }

        // Try to update last login (Best Effort)
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            })
        } catch (e) {
            console.warn('Skipping write Op (Read-only DB): Update Last Login')
        }

        // Try to log activity (Best Effort)
        try {
            await prisma.activityLog.create({
                data: {
                    user_id: user.id,
                    action: 'LOGIN',
                    details: 'User logged in',
                }
            })
        } catch (e) {
            console.warn('Skipping write Op (Read-only DB): Activity Log')
        }

        // Return success regardless of write failures
        return NextResponse.json({
            id: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            token: 'dummy-token'
        })
    }
