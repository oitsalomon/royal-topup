import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
    try {
        const data = await request.formData()
        const file: File | null = data.get('file') as unknown as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 1. Try Cloudinary if env variables are configured
        if (
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        ) {
            try {
                const result = await new Promise<any>((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'royal-topup-proofs',
                        },
                        (error, result) => {
                            if (error) reject(error)
                            else resolve(result)
                        }
                    )
                    uploadStream.end(buffer)
                })

                if (result?.secure_url) {
                    return NextResponse.json({ url: result.secure_url })
                }
            } catch (cError) {
                console.warn('Cloudinary upload failed, falling back to local public/uploads:', cError)
            }
        }

        // 2. Resilient Fallback: Save to public/uploads
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        await fs.mkdir(uploadsDir, { recursive: true })
        const ext = file.name ? path.extname(file.name) || '.jpg' : '.jpg'
        const cleanExt = ext.startsWith('.') ? ext : `.${ext}`
        const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${cleanExt}`
        const filePath = path.join(uploadsDir, fileName)
        await fs.writeFile(filePath, buffer)

        return NextResponse.json({ url: `/uploads/${fileName}` })

    } catch (error: any) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
    }
}
