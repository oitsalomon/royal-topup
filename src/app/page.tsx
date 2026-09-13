import InstantTopUpForm from '@/components/preview/InstantTopUpForm'
import { getStorePackages } from '@/services/store-packages'

export const revalidate = 60

export default async function Home() {
  const initialPackages = await getStorePackages()

  return (
    <div className="min-h-screen bg-[#0d0d0f]">
      <InstantTopUpForm
        gameCode="royal-dream"
        gameName="Royal Dream"
        gameId={1}
        initialPackages={initialPackages}
      />
    </div>
  )
}


