'use client'

import { useState } from 'react'
import TopUpForm from './TopUpForm'
import WithdrawForm from './WithdrawForm'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface TransactionTabsProps {
    gameCode: string
    gameName: string
}

export default function TransactionTabs({ gameCode, gameName }: TransactionTabsProps) {
    const [activeTab, setActiveTab] = useState<'TOPUP' | 'WITHDRAW'>('TOPUP')

    return (
        <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/10">
                <button
                    onClick={() => setActiveTab('TOPUP')}
                    className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'TOPUP'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <ArrowUpCircle size={20} />
                    <span className="font-bold">Top Up</span>
                </button>
                <button
                    onClick={() => setActiveTab('WITHDRAW')}
                    className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'WITHDRAW'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <ArrowDownCircle size={20} />
                    <span className="font-bold">Withdraw</span>
                </button>
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'TOPUP' ? (
                    <TopUpForm gameCode={gameCode} gameName={gameName} />
                ) : (
                    <WithdrawForm gameCode={gameCode} gameName={gameName} />
                )}
            </div>
        </div>
    )
}
