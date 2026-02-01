import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import clsx from 'clsx';
import { motion } from 'framer-motion';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.00');

  // Game State
  const [roundId, setRoundId] = useState(602);
  const [status, setStatus] = useState('OPEN');
  const [timeLeft, setTimeLeft] = useState(0);

  const [selectedColor, setSelectedColor] = useState(null);
  const [betAmount, setBetAmount] = useState('0.01');

  const [history, setHistory] = useState([
    { roundId: 577, bet: '1000', color: 'VIOLET', result: 'RED', balanceBefore: '3093.96', balanceAfter: '2093.96', winLoss: '-1000' },
    { roundId: 576, bet: '100', color: 'GREEN', result: 'GREEN', balanceBefore: '2993.96', balanceAfter: '3093.96', winLoss: '+200.00' },
    { roundId: 575, bet: '30', color: 'GREEN', result: 'RED', balanceBefore: '3023.96', balanceAfter: '2993.96', winLoss: '-30' },
    { roundId: 574, bet: '10', color: 'RED', result: 'RED', balanceBefore: '3013.96', balanceAfter: '3023.96', winLoss: '+20.00' },
    { roundId: 573, bet: '10', color: 'RED', result: 'RED', balanceBefore: '3003.96', balanceAfter: '3013.96', winLoss: '+20.00' },
    { roundId: 572, bet: '1001.98', color: 'RED', result: 'RED', balanceBefore: '2001.98', balanceAfter: '3003.96', winLoss: '+2003.96' },
    { roundId: 571, bet: '0.99', color: 'RED', result: 'RED', balanceBefore: '2000.99', balanceAfter: '2001.98', winLoss: '+1.98' },
    { roundId: 567, bet: '2000', color: 'RED', result: 'GREEN', balanceBefore: '2000.99', balanceAfter: '0.99', winLoss: '-2000' },
  ]);

  const [lastResults, setLastResults] = useState([
    'RED', 'GREEN', 'VIOLET', 'GREEN', 'GREEN', 'GREEN', 'RED', 'RED', 'RED', 'RED', 'GREEN', 'RED'
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);
      setBalance('3093.96');
    } catch (err) {
      console.error(err);
      alert("Connection failed");
    }
  };

  const handleBet = () => {
    if (!selectedColor || !betAmount) return;
    console.log(`Betting ${betAmount} on ${selectedColor}`);
  };

  const quickAmounts = ['0.01', '0.1', '1', '10'];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white font-sans">
      {/* Header */}
      <header className="bg-[#1a1f3a] py-4 px-6 flex items-center justify-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h1 className="text-2xl font-bold">
            <span className="text-white">Color</span>
            <span className="text-purple-500">Predict</span>
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Wallet Card */}
          <div className="bg-[#1a1f3a] rounded-2xl p-4 border border-gray-800">
            {!account ? (
              <button
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <span>🔗</span>
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Address</div>
                  <div className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Balance</div>
                  <div className="font-bold">{balance} CGT</div>
                </div>
              </div>
            )}
          </div>

          {/* Round Info */}
          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-gray-400 text-sm">Round </span>
                <span className="text-3xl font-bold text-blue-400">{roundId}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-400">{status}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2f4a" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    animate={{ strokeDashoffset: 283 - (timeLeft / 30) * 283 }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl">⏱️</div>
                  <div className="text-5xl font-bold tabular-nums">{timeLeft}<span className="text-2xl">s</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Betting Panel */}
          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold mb-4">Place Your Bet</h3>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">BET AMOUNT</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">💰</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-[#0a0e27] border border-gray-700 rounded-xl py-3 pl-12 pr-16 text-lg font-bold focus:outline-none focus:border-purple-500"
                  placeholder="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">CGT</span>
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2 mt-3">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    onClick={() => setBetAmount(val)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0a0e27] hover:bg-[#1a1f3a] border border-gray-700 text-sm font-medium"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">SELECT COLOR</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'RED', label: 'RED', color: 'bg-red-500', multiplier: '2x' },
                  { id: 'GREEN', label: 'GREEN', color: 'bg-green-500', multiplier: '2x' },
                  { id: 'VIOLET', label: 'VIOLET', color: 'bg-purple-500', multiplier: '5x' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={clsx(
                      "p-4 rounded-xl flex flex-col items-center gap-2 transition-all",
                      selectedColor === c.id
                        ? `${c.color} shadow-lg`
                        : "bg-[#0a0e27] hover:bg-[#1a1f3a] border border-gray-700"
                    )}
                  >
                    <div className={clsx("w-4 h-4 rounded-full", c.color)} />
                    <span className="font-bold text-sm">{c.label}</span>
                    <span className="text-xs opacity-70">{c.multiplier}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Place Bet Button */}
            <button
              onClick={handleBet}
              disabled={!selectedColor || !betAmount}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
            >
              <span>🎲</span>
              Place Bet
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Last Results */}
          <div className="bg-[#1a1f3a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>🎯</span> Last Results
              </h3>
              <span className="text-xs text-gray-500">0</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lastResults.map((result, i) => (
                <div
                  key={i}
                  className={clsx(
                    "w-8 h-8 rounded-full",
                    result === 'RED' && "bg-red-500",
                    result === 'GREEN' && "bg-green-500",
                    result === 'VIOLET' && "bg-purple-500"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Betting History */}
          <div className="bg-[#1a1f3a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>📊</span> My Betting History
              </h3>
              <button className="text-xs text-gray-400 hover:text-white">Clear</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">TOTAL BETS</div>
                <div className="text-lg font-bold">0</div>
              </div>
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">WINS</div>
                <div className="text-lg font-bold text-green-400">0</div>
              </div>
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">LOSSES</div>
                <div className="text-lg font-bold text-red-400">0</div>
              </div>
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">NET P/L</div>
                <div className="text-lg font-bold text-orange-400">0 CGT</div>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2">ROUND</th>
                    <th className="text-left py-2">BET</th>
                    <th className="text-left py-2">COLOR</th>
                    <th className="text-left py-2">RESULT</th>
                    <th className="text-right py-2">WIN/LOSS</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className={clsx("border-b border-gray-800", h.winLoss.startsWith('+') ? "bg-green-500/5" : "bg-red-500/5")}>
                      <td className="py-2">#{h.roundId}</td>
                      <td className="py-2">{h.bet}</td>
                      <td className="py-2">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-xs font-bold",
                          h.color === 'RED' && "bg-red-500/20 text-red-400",
                          h.color === 'GREEN' && "bg-green-500/20 text-green-400",
                          h.color === 'VIOLET' && "bg-purple-500/20 text-purple-400"
                        )}>
                          {h.color}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-xs font-bold",
                          h.result === 'RED' && "bg-red-500/20 text-red-400",
                          h.result === 'GREEN' && "bg-green-500/20 text-green-400",
                          h.result === 'VIOLET' && "bg-purple-500/20 text-purple-400"
                        )}>
                          {h.result}
                        </span>
                      </td>
                      <td className={clsx("py-2 text-right font-bold", h.winLoss.startsWith('+') ? "text-green-400" : "text-red-400")}>
                        {h.winLoss}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
