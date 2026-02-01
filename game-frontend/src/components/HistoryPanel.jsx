import clsx from 'clsx';

export default function HistoryPanel({ history = [] }) {
    return (
        <div className="glass-panel p-6 rounded-3xl h-full min-h-[500px] flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                <span>📜 Betting History</span>
                <span className="text-xs bg-white/5 px-2 py-1 rounded-lg text-slate-400">Latest 50</span>
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {!history.length ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                        <div className="text-4xl mb-2">👻</div>
                        <div className="text-sm">No bets placed yet</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((bet, i) => (
                            <div key={i} className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-slate-500">#{bet.roundId}</span>
                                    <div className="flex flex-col">
                                        <span className={clsx(
                                            "font-bold text-xs uppercase px-1.5 py-0.5 rounded",
                                            bet.betColor === 'RED' && "bg-red-500/20 text-red-400",
                                            bet.betColor === 'GREEN' && "bg-green-500/20 text-green-400",
                                            bet.betColor === 'VIOLET' && "bg-violet-500/20 text-violet-400",
                                        )}>
                                            {bet.betColor}
                                        </span>
                                        <span className="text-xs text-slate-400 mt-0.5">{bet.betAmount} CGT</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {bet.won ? (
                                        <div className="text-green-400 font-bold">+{bet.winAmount}</div>
                                    ) : (
                                        <div className="text-red-400 font-bold">-{bet.betAmount}</div>
                                    )}
                                    <div className="text-[10px] text-slate-500">Result: {bet.resultColor}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
