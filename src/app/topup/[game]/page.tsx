import TransactionTabs from '@/components/TransactionTabs'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'


export async function generateMetadata({ params }: { params: Promise<{ game: string }> }) {
    const { game: slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = decodedSlug.replace(/-/g, '_').toUpperCase()

    const game = await prisma.game.findFirst({
        where: {
            isActive: true,
            OR: [
                { code: decodedSlug },
                { code: normalizedSlug },
                { code: decodedSlug.toUpperCase() }
            ]
        }
    })

    if (!game) {
        return {
            title: 'Game Tidak Ditemukan | Clover Store',
            description: 'Layanan top up game tidak ditemukan.'
        }
    }

    return {
        title: `Top Up ${game.name} Murah | Beli Chips & Diamond`,
        description: `Beli Chips ${game.name} dan Diamond termurah, proses detik, layanan 24 jam. Top Up ${game.name} aman hanya di Clover Store.`,
        keywords: [`Top Up ${game.name}`, `Beli Chips ${game.name}`, `Harga ${game.name}`, `${game.name} Murah`, "Top Up Game", "Clover Store"],
        alternates: {
            canonical: `/topup/${slug}`
        },
        openGraph: {
            title: `Top Up ${game.name} Murah | Beli Chips & Diamond`,
            description: `Layanan Top Up ${game.name} termurah dan terpercaya.`,
            images: [game.image || '/images/og-image.jpg'],
        }
    }
}

export default async function TopUpPage({ params }: { params: Promise<{ game: string }> }) {
    const { game: slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    const normalizedSlug = decodedSlug.replace(/-/g, '_').toUpperCase()

    const game = await prisma.game.findFirst({
        where: {
            isActive: true,
            OR: [
                { code: decodedSlug }, // Exact match
                { code: normalizedSlug }, // Standardized
                { code: decodedSlug.toUpperCase() } // Case insensitive fallback
            ]
        }
    })

    if (!game) return notFound()

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": `Top Up ${game.name}`,
        "image": game.image,
        "description": `Layanan Top Up ${game.name} termurah dan proses cepat.`,
        "brand": {
            "@type": "Brand",
            "name": "Clover Store"
        },
        "offers": {
            "@type": "AggregateOffer",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://clover-store-vip.vercel.app'}/topup/${slug}`,
            "priceCurrency": "IDR",
            "lowPrice": "1000",
            "highPrice": "1000000",
            "offerCount": "10",
            "availability": "https://schema.org/InStock"
        }
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">{game.name}</h1>
                    <p className="text-gray-400">Pilih layanan Top Up atau Withdraw</p>
                </div>

                <TransactionTabs gameCode={game.code} gameName={game.name} gameId={game.id} />
            </div>
        </div>
    )
}

