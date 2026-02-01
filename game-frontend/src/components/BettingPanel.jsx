import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const COLORS = [
    { id: 'RED', label: 'RED', multiplier: '2x', color: 'bg-red-500', from: 'from-red-500', to: 'to-orange-600', shadow: 'shadow-red-500/40' },
    { id: 'GREEN', label: 'GREEN', multiplier: '2x', color: 'bg-green-500', from: 'from-green-500', to: 'to-emerald-600', shadow: 'shadow-green-500/40' },
    { id: 'VIOLET', label: 'VIOLET', multiplier: '5x', color: 'bg-violet-500', from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/40' },
];

export default function BettingPanel({ onBet, isBetting }) {
    const [amount, setAmount] = useState('0.01');
    const [selectedColor, setSelectedColor] = useState(null);

    return (
        <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>🎲</span> Place Your Bet
            </h3>

            {/* Amount Input */}
            <div className="mb-8">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Bet Amount</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">💰</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-16 text-xl font-bold text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                        placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">CGT</span>
                </div>

                {/* Quick Amounts */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-none">
                    {['0.01', '0.1', '1.0', '10', '100'].map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            {val}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Selection */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {COLORS.map((c) => (
                    <motion.button
                        key={c.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedColor(c.id)}
                        className={clsx(
                            "relative overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center gap-2 group transition-all duration-300",
                            selectedColor === c.id
                                ? `bg-gradient-to-br ${c.from} ${c.to} shadow-lg ${c.shadow} ring-2 ring-white/20`
                                : "bg-slate-800/40 hover:bg-slate-800/60 border border-white/5"
                        )}
                    >
                        <div className={clsx("w-3 h-3 rounded-full", c.color, selectedColor === c.id ? "bg-white" : "")} />
                        <span className="font-bold tracking-tight">{c.label}</span>
                        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", selectedColor === c.id ? "bg-white/20 text-white" : "bg-white/5 text-slate-400")}>
                            {c.multiplier}
                        </span>
                    </motion.button>
                ))}
            </div>

            <button
                disabled={!selectedColor || !amount || isBetting}
                onClick={() => onBet(selectedColor, amount)}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
            >
                {isBetting ? 'Processing...' : 'Place Bet'}
            </button>

        </div>
    );
}
