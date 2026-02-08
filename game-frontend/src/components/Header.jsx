import { useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Header({
    isDarkMode,
    setIsDarkMode,
    account,
    balance,
    connectWallet,
    isConnecting,
    isMobile,
    setShowHelpModal,
    mintTokens,
    mintAmount,
    setMintAmount,
    wakeUpServer
}) {
    return (
        <header className={clsx("border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
            <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        CP
                    </div>
                    <div>
                        <h1 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>Color Prediction</h1>
                        <p className={clsx("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>Multi-Game Platform</p>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {/* Dark Mode Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={clsx("p-2 rounded-lg transition-colors", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-yellow-400" : "bg-gray-100 hover:bg-gray-200 text-gray-700")}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>

                {/* Wake Server Button */}
                <button
                    onClick={wakeUpServer}
                    className={clsx("p-2 rounded-lg transition-colors", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-yellow-400" : "bg-gray-100 hover:bg-gray-200 text-gray-700")}
                    title="Wake up server"
                >
                    ⚡
                </button>

                {account ? (
                    <>
                        <div className="text-right hidden sm:block">
                            <div className={clsx("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>Your Balance</div>
                            <div className={clsx("text-lg font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{balance} <span className={clsx("text-sm font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>CGT</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={mintAmount}
                                onChange={(e) => setMintAmount(e.target.value)}
                                className={clsx(
                                    "w-24 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                    isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900"
                                )}
                                placeholder="Amount"
                            />
                            <button
                                onClick={mintTokens}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors border border-transparent"
                            >
                                Mint
                            </button>
                        </div>
                        <div className={clsx("px-4 py-2 rounded-lg text-sm font-mono border hidden sm:block", isDarkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-gray-100 text-gray-700 border-gray-300")}>
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={connectWallet}
                            disabled={isConnecting}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                        >
                            {isConnecting ? 'Connecting...' : (isMobile ? '📱 Connect Wallet' : 'Connect Wallet')}
                        </button>
                        {isMobile && (
                            <button
                                onClick={() => setShowHelpModal(true)}
                                className={clsx("p-2.5 rounded-lg border transition-colors", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200")}
                                title="How to connect on mobile"
                            >
                                ❓
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
