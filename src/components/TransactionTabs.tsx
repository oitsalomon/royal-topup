'use client'

import { useState } from 'react'
import TopUpForm from './TopUpForm'
import WithdrawForm from './WithdrawForm'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface TransactionTabsProps {
    gameCode: string
    gameName: string
    gameId: number
}

export default function TransactionTabs({ gameCode, gameName, gameId }: TransactionTabsProps) {
    const [activeTab, setActiveTab] = useState<'TOPUP' | 'WITHDRAW'>('TOPUP')

    return (
        <div className="space-y-6">
            {/* Minimalist Tab Navigation */}
            <div className="flex border-b border-white/10 relative">
                <button
                    onClick={() => setActiveTab('TOPUP')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all duration-300 relative ${activeTab === 'TOPUP'
                        ? 'text-amber-400 font-bold'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    <ArrowUpCircle size={20} />
                    <span>Top Up</span>
                    {activeTab === 'TOPUP' && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    )}
                </button>
                <div className="w-[1px] bg-white/5 my-3" />
                <button
                    onClick={() => setActiveTab('WITHDRAW')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all duration-300 relative ${activeTab === 'WITHDRAW'
                        ? 'text-amber-400 font-bold'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    <ArrowDownCircle size={20} />
                    <span>Bongkar (WD)</span>
                    {activeTab === 'WITHDRAW' && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    )}
                </button>
            </div>

            {/* Content Container (No unnecessary animations for speed) */}
            <div className="pt-4">
                {activeTab === 'TOPUP' ? (
                    <TopUpForm gameCode={gameCode} gameName={gameName} gameId={gameId} />
                ) : (
                    <WithdrawForm gameCode={gameCode} gameName={gameName} />
                )}
            </div>
        </div>
    )
}
