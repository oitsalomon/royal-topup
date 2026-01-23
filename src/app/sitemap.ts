import { MetadataRoute } from 'next'
import { getGames } from '@/services/games'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clover-store-vip.vercel.app'

    // Static routes
    const routes = [
        '',
        '/check-transaction',
        '/login',
        '/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // Dynamic routes (Games) but verify fetch doesn't crash build if DB not connected
    let gameRoutes: MetadataRoute.Sitemap = []
    try {
        // Check if we can fetch games safely
        const games = await getGames(true)
        if (Array.isArray(games)) {
            gameRoutes = games.map((game: any) => ({
                url: `${baseUrl}/topup/${game.code.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')}`,
                lastModified: new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.9,
            }))
        }
    } catch (error) {
        console.error('Failed to fetch games for sitemap', error)
    }

    return [...routes, ...gameRoutes]
}
