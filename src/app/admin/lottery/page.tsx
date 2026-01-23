import LotteryManager from '@/components/admin/LotteryManager'

export default function AdminLotteryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Lottery System</h1>
            </div>
            <LotteryManager />
        </div>
    )
}
