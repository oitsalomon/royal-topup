import InstantTopUpForm from '@/components/preview/InstantTopUpForm'

export const dynamic = 'force-dynamic'

export default function TopUpPage() {
    return (
        <div className="bg-[#0d0d0f]">
            <InstantTopUpForm
                gameCode="royal-dream"
                gameName="Royal Dream"
                gameId={1}
            />
        </div>
    )
}
