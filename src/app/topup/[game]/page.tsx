import InstantTopUpForm from '@/components/preview/InstantTopUpForm'
import { prisma } from '@/lib/prisma'
import { getStorePackages } from '@/services/store-packages'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }) {
    const { game: slug } = await params
    const decodedSlug = decodeURIComponent(slug || 'royal-dream')

    return {
        title: `Top Up Royal Dream Termurah | Proses Instan QRIS`,
        description: `Beli Chip Royal Dream termurah, proses otomatis hitungan detik langsung via QRIS 24 jam.`,
        keywords: [`Top Up Royal Dream`, `Beli Chip Royal Dream`, `Clover Store`],
        alternates: {
            canonical: `/topup/${slug}`
        }
    }
}

export default async function TopUpPage({ params }: { params: Promise<{ game: string }> }) {
    const { game: slug } = await params
    const decodedSlug = decodeURIComponent(slug || 'royal-dream')
    const normalizedSlug = decodedSlug.replace(/-/g, '_').toUpperCase()

    let game: any = null
    try {
        game = await prisma.game.findFirst({
            where: {
                isActive: true,
                OR: [
                    { code: decodedSlug },
                    { code: normalizedSlug },
                    { code: decodedSlug.toUpperCase() }
                ]
            }
        })
    } catch {
        // Fallback when DB is unreachable
    }

    if (!game) {
        game = {
            id: 1,
            name: 'Royal Dream',
            code: decodedSlug || 'royal-dream',
            image: '/images/games/royal-dream.png'
        }
    }

    const initialPackages = await getStorePackages()

    return (
        <div className="min-h-screen bg-[#0d0d0f]">
            <InstantTopUpForm
                gameCode={game.code}
                gameName={game.name}
                gameId={game.id}
                initialPackages={initialPackages}
            />
        </div>
    )
}


