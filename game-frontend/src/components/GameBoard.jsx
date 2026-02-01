import { motion } from 'framer-motion';

export default function GameBoard({ roundId, status, timeLeft, totalTime = 30 }) {
    const progress = (timeLeft / totalTime) * 283; // 2 * PI * 45

    return (
        <div className="glass-panel p-6 sm:p-10 rounded-3xl relative overflow-hidden group">
            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                    <div className="text-slate-400 font-medium mb-1">Current Round</div>
                    <div className="text-4xl sm:text-5xl font-bold font-display text-white">
                        #{roundId || '0000'}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className={`w-2 h-2 rounded-full ${status === 'OPEN' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm font-semibold tracking-wide text-white/90">
                            {status || 'LOADING'}
                        </span>
                    </div>
                </div>

                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Timer SVG */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-slate-800"
                        />
                        <motion.circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className="text-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                            strokeDasharray="283"
                            animate={{ strokeDashoffset: 283 - progress }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold tabular-nums">{timeLeft}s</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
