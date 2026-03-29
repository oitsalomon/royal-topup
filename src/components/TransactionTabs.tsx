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
        <div className="space-y-10">
            {/* V4 Tab Navigation */}
            <div className="v4-glass p-2 rounded-2xl md:rounded-[24px] flex items-center shadow-xl max-w-lg mx-auto border border-white/10">
                <button
                    onClick={() => setActiveTab('TOPUP')}
                    className={`flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden group ${activeTab === 'TOPUP'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <ArrowUpCircle size={20} className={activeTab === 'TOPUP' ? 'animate-bounce' : ''} />
                    <span className="v4-font-syne font-black uppercase tracking-widest text-xs md:text-sm">Beli Chip</span>
                </button>
                <div className="w-[1px] h-8 bg-white/5 mx-2 hidden md:block" />
                <button
                    onClick={() => setActiveTab('WITHDRAW')}
                    className={`flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden group ${activeTab === 'WITHDRAW'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <ArrowDownCircle size={20} className={activeTab === 'WITHDRAW' ? 'animate-bounce' : ''} />
                    <span className="v4-font-syne font-black uppercase tracking-widest text-xs md:text-sm">Bongkar (WD)</span>
                </button>
            </div>

            {/* Content Container */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                {activeTab === 'TOPUP' ? (
                    <TopUpForm gameCode={gameCode} gameName={gameName} gameId={gameId} />
                ) : (
                    <WithdrawForm gameCode={gameCode} gameName={gameName} />
                )}
            </div>
        </div>
    )
}
