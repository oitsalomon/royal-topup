import TransactionTabs from '@/components/TransactionTabs'

export default async function TopUpPage({ params }: { params: Promise<{ game: string }> }) {
    const { game } = await params
    const gameName = game.replace('-', ' ').toUpperCase()

    return (
        <div className="min-h-screen bg-black pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">{gameName}</h1>
                    <p className="text-gray-400">Pilih layanan Top Up atau Withdraw</p>
                </div>

                <TransactionTabs gameCode={game} gameName={gameName} />
            </div>
        </div>
    )
}
