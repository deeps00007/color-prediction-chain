import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { COLOR_MAP, CONTRACT_ADDRESS } from '../config';

export default function ColorGame({
    isDarkMode,
    account,
    signer,
    tokenContract,
    gameContract,
    showMessage,
    balance,
    setBalance // Need to update balance after bet/payout
}) {
    const [currentRound, setCurrentRound] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [selectedColor, setSelectedColor] = useState(null);
    const [betAmount, setBetAmount] = useState('10');
    const [isBetting, setIsBetting] = useState(false);
    const [myBet, setMyBet] = useState(null);
    const [history, setHistory] = useState([]);
    const [lastResults, setLastResults] = useState([]);

    // --- Logic Extracted from App.jsx ---

    const handleBet = async () => {
        if (!gameContract || !tokenContract || !signer || !account) return showMessage("Connect wallet first", 'error');
        if (!currentRound || currentRound.status !== "OPEN") return showMessage("Betting is closed", 'error');
        if (!selectedColor) return showMessage("Select a color", 'error');
        if (!betAmount || parseFloat(betAmount) <= 0) return showMessage("Enter valid amount", 'error');
        if (parseFloat(betAmount) > parseFloat(balance)) return showMessage("Insufficient balance", 'error');

        setIsBetting(true);
        const amountWei = ethers.parseEther(betAmount.toString());

        try {
            const tokenWithSigner = tokenContract.connect(signer);
            const allowance = await tokenWithSigner.allowance(account, CONTRACT_ADDRESS);

            if (allowance < amountWei) {
                const approveTx = await tokenWithSigner.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
                await approveTx.wait();
            }

            const balanceBefore = await tokenContract.balanceOf(account);
            const tx = await gameContract.placeBet(currentRound.id, COLOR_MAP[selectedColor], amountWei);
            await tx.wait();

            const balanceAfter = await tokenContract.balanceOf(account);

            setMyBet({
                roundId: currentRound.id,
                color: selectedColor,
                amount: betAmount,
                balanceBefore: ethers.formatEther(balanceBefore),
                balanceAfter: ethers.formatEther(balanceAfter),
            });

            showMessage(`Bet placed: ${betAmount} CGT on ${selectedColor}`, 'success');
            setBalance(parseFloat(ethers.formatEther(balanceAfter)).toFixed(2));
            setSelectedColor(null);
            loadUserBets();

        } catch (error) {
            console.error(error);
            showMessage(error.code === 4001 ? "Transaction rejected" : "Bet failed", 'error');
        } finally {
            setIsBetting(false);
        }
    };

    const loadRound = async () => {
        try {
            const { data } = await supabase.from("rounds").select("*").order("id", { ascending: false }).limit(1);
            if (!data?.length) return;

            const newRound = data[0];
            const isNewRound = currentRound && newRound.id > currentRound.id;
            const isResolved = currentRound && currentRound.status !== "RESOLVED" && newRound.status === "RESOLVED";

            if (isResolved) {
                handleResult(newRound);
            } else if (isNewRound) {
                loadUserBets();
            }
            setCurrentRound(newRound);
        } catch (err) {
            console.error(err);
        }
    };

    const loadResultHistory = async () => {
        try {
            const { data } = await supabase.from("round_results_history").select("*").order("id", { ascending: false }).limit(10);
            if (data) setLastResults(data.map(r => r.color.toUpperCase()));
        } catch (err) { }
    };

    const handleResult = async (round) => {
        const winningColor = round.result_color?.toUpperCase();
        if (!myBet || myBet.roundId !== round.id || !tokenContract || !account) return;

        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalBalance = await tokenContract.balanceOf(account);
        const won = myBet.color === winningColor;

        const multiplier = winningColor === "VIOLET" ? 5 : 2;
        const winLossAmount = won ? `+${(parseFloat(myBet.amount) * multiplier).toFixed(2)}` : `-${myBet.amount}`;

        showMessage(won ? `You won ${winLossAmount} CGT!` : `You lost ${myBet.amount} CGT`, won ? 'success' : 'error');

        await loadUserBets(); // Refresh history

        setBalance(parseFloat(ethers.formatEther(finalBalance)).toFixed(2));
        setMyBet(null);
    };

    const loadUserBets = async () => {
        if (!gameContract || !account) return;

        try {
            const filter = gameContract.filters.BetPlaced(null, account);
            const events = await gameContract.queryFilter(filter);

            const roundIds = events.map(e => e.args[0].toString());
            if (roundIds.length === 0) {
                setHistory([]);
                return;
            }

            const { data: roundsData } = await supabase
                .from("rounds")
                .select("id, result_color")
                .in("id", roundIds);

            const roundsMap = {};
            roundsData?.forEach(r => roundsMap[r.id] = r.result_color);

            const historyItems = events.map(e => {
                const roundId = e.args[0].toString();
                const colorCode = Number(e.args[2]);
                const amountWei = e.args[3];

                let colorName = 'RED';
                if (colorCode === 1) colorName = 'GREEN';
                if (colorCode === 2) colorName = 'VIOLET';

                const resultColor = roundsMap[roundId]?.toUpperCase();
                const betAmount = ethers.formatEther(amountWei);

                let won = false;
                let winLossAmount = `-${betAmount}`;

                if (resultColor && resultColor === colorName) {
                    won = true;
                    const multiplier = resultColor === "VIOLET" ? 5 : 2;
                    winLossAmount = `+${(parseFloat(betAmount) * multiplier).toFixed(2)}`;
                }

                return {
                    roundId,
                    bet: betAmount,
                    color: colorName,
                    result: resultColor,
                    winLoss: winLossAmount,
                    won: won,
                    isPending: !resultColor
                };
            });

            historyItems.sort((a, b) => b.roundId - a.roundId);
            setHistory(historyItems);

        } catch (err) {
            console.error("Failed to load history:", err);
        }
    };

    useEffect(() => {
        if (account && gameContract) {
            loadUserBets();
        }
    }, [account, gameContract]);


    useEffect(() => {
        if (!currentRound) return;
        const timer = setInterval(() => {
            const remaining = Math.floor((new Date(currentRound.end_time) - new Date()) / 1000);
            setTimeLeft(remaining > 0 ? remaining : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, [currentRound]);

    useEffect(() => {
        loadRound();
        loadResultHistory();

        const roundsChannel = supabase.channel("rounds-live").on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, loadRound).subscribe();
        const historyChannel = supabase.channel("history-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "round_results_history" }, loadResultHistory).subscribe();

        return () => {
            roundsChannel.unsubscribe();
            historyChannel.unsubscribe();
        };
    }, []); // Only run once on mount

    // --- Render ---

    return (
        <div className={clsx("flex-1 overflow-y-auto p-6", isDarkMode ? "bg-gray-900" : "bg-gray-50")}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Timer & Results */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Timer Card */}
                        <div className={clsx("rounded-xl p-6 shadow-sm border", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                            <div className="text-center">
                                <div className={clsx("text-sm font-medium mb-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>Time Remaining</div>
                                <div className={clsx(
                                    "text-6xl font-bold tabular-nums mb-4",
                                    timeLeft <= 5 ? "text-red-600" : (isDarkMode ? "text-white" : "text-gray-900")
                                )}>
                                    {timeLeft}<span className={clsx("text-3xl", isDarkMode ? "text-gray-500" : "text-gray-400")}>s</span>
                                </div>
                                <div className={clsx("inline-flex items-center gap-2 px-4 py-2 border rounded-full", isDarkMode ? "bg-green-900/30 border-green-700" : "bg-green-50 border-green-200")}>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className={clsx("text-sm font-medium", isDarkMode ? "text-green-400" : "text-green-700")}>{currentRound?.status || 'LOADING'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Results */}
                        <div className={clsx("rounded-xl p-6 shadow-sm border", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                            <h3 className={clsx("text-sm font-semibold mb-4", isDarkMode ? "text-gray-200" : "text-gray-700")}>Recent Results</h3>
                            <div className="flex flex-wrap gap-2">
                                {lastResults.map((result, i) => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm",
                                            result === 'RED' && "bg-red-500",
                                            result === 'GREEN' && "bg-green-500",
                                            result === 'VIOLET' && "bg-purple-500"
                                        )}
                                    >
                                        {result[0]}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Active Bet */}
                        {myBet && (
                            <div className={clsx("border rounded-xl p-4", isDarkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200")}>
                                <div className={clsx("text-sm font-medium mb-1", isDarkMode ? "text-blue-300" : "text-blue-900")}>Active Bet</div>
                                <div className={clsx(isDarkMode ? "text-blue-200" : "text-blue-700")}>
                                    <span className="font-bold">{myBet.amount} CGT</span> on{' '}
                                    <span className={clsx(
                                        "font-bold",
                                        myBet.color === 'RED' && "text-red-600",
                                        myBet.color === 'GREEN' && "text-green-600",
                                        myBet.color === 'VIOLET' && "text-purple-600"
                                    )}>
                                        {myBet.color}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Middle Column - Betting */}
                    <div className="lg:col-span-5">
                        <div className={clsx("rounded-xl p-6 shadow-sm border", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                            <h2 className={clsx("text-lg font-bold mb-6", isDarkMode ? "text-white" : "text-gray-900")}>Place Your Bet</h2>

                            <div className="space-y-6">
                                {/* Color Selection */}
                                <div>
                                    <label className={clsx("block text-sm font-semibold mb-3", isDarkMode ? "text-gray-200" : "text-gray-700")}>Select Color</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'RED', label: 'Red', color: 'bg-red-500', hoverColor: 'hover:bg-red-600', borderColor: 'border-red-600', multiplier: '2x' },
                                            { id: 'GREEN', label: 'Green', color: 'bg-green-500', hoverColor: 'hover:bg-green-600', borderColor: 'border-green-600', multiplier: '2x' },
                                            { id: 'VIOLET', label: 'Violet', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', borderColor: 'border-purple-600', multiplier: '5x' },
                                        ].map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => setSelectedColor(c.id)}
                                                className={clsx(
                                                    "p-4 rounded-lg border-2 transition-all text-white font-semibold",
                                                    selectedColor === c.id
                                                        ? `${c.color} ${c.borderColor} ring-4 ring-opacity-30 ${c.color.replace('bg-', 'ring-')}`
                                                        : `${c.color} border-transparent ${c.hoverColor}`
                                                )}
                                            >
                                                <div className="text-center">
                                                    <div className="text-base">{c.label}</div>
                                                    <div className="text-xs opacity-90 mt-1">{c.multiplier} payout</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className={clsx("block text-sm font-semibold mb-3", isDarkMode ? "text-gray-200" : "text-gray-700")}>Bet Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(e.target.value)}
                                            className={clsx("w-full border-2 focus:border-indigo-500 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100", isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900")}
                                            placeholder="Enter amount"
                                        />
                                        <div className={clsx("absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                                            CGT
                                        </div>
                                    </div>

                                    {/* Quick Select */}
                                    <div className="grid grid-cols-4 gap-2 mt-3">
                                        {['10', '50', '100', '500'].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setBetAmount(val)}
                                                className={clsx(
                                                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                                                    betAmount === val
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : (isDarkMode ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
                                                )}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Place Bet Button */}
                                <button
                                    onClick={handleBet}
                                    disabled={!selectedColor || !betAmount || isBetting || !account}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-sm"
                                >
                                    {isBetting ? 'Processing Transaction...' : 'Place Bet'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - History */}
                    <div className="lg:col-span-4">
                        <div className={clsx("rounded-xl p-6 shadow-sm border", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={clsx("text-sm font-semibold", isDarkMode ? "text-gray-200" : "text-gray-700")}>Betting History</h3>
                                {history.length > 0 && (
                                    <button
                                        onClick={() => setHistory([])}
                                        className={clsx("text-xs", isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {history.length === 0 ? (
                                    <div className={clsx("text-center py-12 text-sm", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                                        No bets placed yet
                                    </div>
                                ) : (
                                    history.map((h, i) => (
                                        <div
                                            key={i}
                                            className={clsx(
                                                "p-3 rounded-lg border-2",
                                                h.isPending
                                                    ? (isDarkMode ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-200")
                                                    : h.won
                                                        ? (isDarkMode ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200")
                                                        : (isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200")
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <div className={clsx("text-xs font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                                                    Round #{h.roundId}
                                                </div>
                                                <div className={clsx(
                                                    "text-sm font-bold",
                                                    h.isPending
                                                        ? (isDarkMode ? "text-yellow-400" : "text-yellow-700")
                                                        : h.won ? (isDarkMode ? "text-green-400" : "text-green-700") : (isDarkMode ? "text-red-400" : "text-red-700")
                                                )}>
                                                    {h.isPending ? "PENDING" : `${h.winLoss} CGT`}
                                                </div>
                                            </div>
                                            <div className={clsx("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                                                Bet: <span className="font-semibold">{h.bet} CGT</span> on{' '}
                                                <span className={clsx(
                                                    "font-semibold",
                                                    h.color === 'RED' && "text-red-600",
                                                    h.color === 'GREEN' && "text-green-600",
                                                    h.color === 'VIOLET' && "text-purple-600"
                                                )}>
                                                    {h.color}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
