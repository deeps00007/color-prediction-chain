import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletIcon } from '@heroicons/react/24/outline'; // Need to make sure this is right
import clsx from 'clsx';

export default function Navbar({ onConnect, account, balance }) {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await onConnect();
        } catch (e) {
            console.error(e);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center mb-8 rounded-b-2xl mx-4 mt-2">
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-violet-500/20">
                    <span className="text-2xl">🎯</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold font-display tracking-tight text-white">
                        Color<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Predict</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-medium">Blockchain Prediction Market</p>
                </div>
            </div>

            <div>
                {!account ? (
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="glass-button px-6 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 group hover:shadow-lg hover:shadow-violet-500/10 transition-all"
                    >
                        {isConnecting ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <WalletIcon className="w-5 h-5 text-violet-300 group-hover:text-white transition-colors" />
                        )}
                        Connect Wallet
                    </button>
                ) : (
                    <div className="flex items-center gap-4 bg-slate-800/50 p-1.5 rounded-xl border border-white/10">
                        <div className="px-4 py-1.5 rounded-lg bg-slate-900/80 border border-white/5">
                            <span className="text-sm font-bold text-violet-400">{balance} CGT</span>
                        </div>
                        <div className="px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded-lg transition-colors" title="Copy Address">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-medium text-slate-200">
                                {account.slice(0, 6)}...{account.slice(-4)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
