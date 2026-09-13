import WithdrawForm from '@/components/WithdrawForm'

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }) {
    const { game: slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = decodedSlug.replace(/-/g, ' ').toUpperCase()

    return {
        title: `Bongkar Coin ${normalizedSlug} | Penarikan Chip Instan`,
        description: `Layanan Bongkar Coin ${normalizedSlug} terpercaya, proses cepat cair ke rekening bank atau e-wallet Anda 24 jam nonstop.`,
        keywords: [`Withdraw ${normalizedSlug}`, `Bongkar Chip ${normalizedSlug}`, `Jual Chip ${normalizedSlug}`, "Bongkar Koin Game", "Royal Clover"],
    }
}

export default async function WithdrawPage({ params }: { params: Promise<{ game: string }> }) {
    const { game } = await params
    const gameName = game.replace(/-/g, ' ').toUpperCase()

    return (
        <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6 font-inter text-[#f3ecd8] antialiased">
            <div className="text-center space-y-1.5 max-w-xl mx-auto mb-4">
                <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#c5a369] bg-[#17171a] px-2.5 py-1 rounded border border-[#8a6d38]/40 inline-block mb-1">
                    Pencairan Otomatis
                </span>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-[#f3ecd8] tracking-tight">
                    Bongkar Coin {gameName}
                </h1>
                <p className="text-xs sm:text-sm text-[#a89f8a] leading-relaxed">
                    Tukar koin chip Anda menjadi uang tunai langsung ke rekening atau e-wallet dalam hitungan detik.
                </p>
            </div>

            <WithdrawForm gameCode={game} gameName={gameName} />
        </main>
    )
}
