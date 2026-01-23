import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clover-store-vip.vercel.app'
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/profile/', '/api/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
