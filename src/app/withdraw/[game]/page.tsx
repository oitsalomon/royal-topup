import WithdrawForm from '@/components/WithdrawForm'


export async function generateMetadata({ params }: { params: Promise<{ game: string }> }) {
    const { game: slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = decodedSlug.replace(/-/g, ' ').toUpperCase()

    return {
        title: `Withdraw ${normalizedSlug} | Bongkar Chip Aman`,
        description: `Layanan Withdraw ${normalizedSlug} terpercaya, proses cepat cair ke rekening/e-wallet. Bongkar Chip ${normalizedSlug} aman 24 jam.`,
        keywords: [`Withdraw ${normalizedSlug}`, `Bongkar Chip ${normalizedSlug}`, `Jual Chip ${normalizedSlug}`, "Withdraw Game", "Clover Store"],
    }
}

export default async function WithdrawPage({ params }: { params: Promise<{ game: string }> }) {
    const { game } = await params
    const gameName = game.replace(/-/g, ' ').toUpperCase()

    return (
        <div className="min-h-screen bg-black pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Withdraw {gameName}</h1>
                    <p className="text-gray-400">Isi form di bawah ini untuk melakukan Penarikan</p>
                </div>

                <WithdrawForm gameCode={game} gameName={gameName} />
            </div>
        </div>
    )
}
