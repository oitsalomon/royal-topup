import InstantTopUpForm from '@/components/preview/InstantTopUpForm'
import { getStorePackages } from '@/services/store-packages'

export const revalidate = 60

export default async function PreviewTopUpPage({
    params
}: {
    params: Promise<{ game: string }>
}) {
    const { game: slug } = await params
    const decodedSlug = decodeURIComponent(slug || 'royal-dream')

    const game = {
        id: 1,
        name: 'Royal Dream',
        code: decodedSlug || 'royal-dream',
        image: '/images/games/royal-dream.png'
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
