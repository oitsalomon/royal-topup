/**
 * Skeleton components — pure CSS animate-pulse, no library.
 * Usage: import { GameGridSkeleton, TopUpFormSkeleton } from '@/components/Skeleton'
 */

/** Generic pulsing block */
export function SkeletonBlock({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-white/8 rounded-xl ${className}`} />
}

/** Game grid skeleton — matches GameGrid layout */
export function GameGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                    <div className="aspect-[3/4] bg-white/8 rounded-2xl" />
                    <div className="h-3 bg-white/8 rounded-lg w-3/4 mx-auto" />
                </div>
            ))}
        </div>
    )
}

/** Live transaction ticker skeleton */
export function TickerSkeleton() {
    return (
        <div className="fixed bottom-6 left-6 z-50 pointer-events-none">
            <div className="animate-pulse bg-white/5 border border-white/5 px-5 py-3.5 rounded-2xl flex items-center gap-4 w-[280px]">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
            </div>
        </div>
    )
}

/** Dashboard stat card skeleton */
export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-72 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-72 bg-white/5 rounded-2xl animate-pulse" />
            </div>
        </div>
    )
}

/** TopUp form section skeleton */
export function TopUpSkeleton() {
    return (
        <div className="space-y-6 px-4 animate-pulse">
            <div className="h-8 w-40 bg-white/8 rounded-xl" />
            <div className="h-48 bg-white/5 rounded-[32px]" />
            <div className="h-64 bg-white/5 rounded-[32px]" />
            <div className="h-32 bg-white/5 rounded-[32px]" />
        </div>
    )
}

/** Transaction list skeleton */
export function TransactionSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white/5 rounded-xl border border-white/5 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded w-1/3" />
                        <div className="h-3 bg-white/10 rounded w-2/3" />
                    </div>
                    <div className="w-16 h-8 bg-white/10 rounded-lg" />
                </div>
            ))}
        </div>
    )
}
