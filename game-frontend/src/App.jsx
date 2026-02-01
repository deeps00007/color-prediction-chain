import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { supabase } from './supabase';
import {
  CONTRACT_ADDRESS,
  TOKEN_ADDRESS,
  GAME_ABI,
  TOKEN_ABI,
  COLOR_MAP,
  RPC_URLS
} from './config';

function App() {
  // Wallet state
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [gameContract, setGameContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  // Game state
  const [currentRound, setCurrentRound] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Betting state
  const [selectedColor, setSelectedColor] = useState(null);
  const [betAmount, setBetAmount] = useState('0.01');
  const [isBetting, setIsBetting] = useState(false);
  const [myBet, setMyBet] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [lastResults, setLastResults] = useState([]);

  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");

    try {
      // Pick random RPC
      const selectedRpc = RPC_URLS[Math.floor(Math.random() * RPC_URLS.length)];

      // Add Sepolia network
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'SepoliaETH', decimals: 18 },
            rpcUrls: RPC_URLS,
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } catch (e) {
        console.log("Network add error:", e);
      }

      // Get signer from MetaMask
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      const addr = await userSigner.getAddress();

      // Use public RPC for read operations
      const readProvider = new ethers.JsonRpcProvider(selectedRpc);

      // Init contracts
      const game = new ethers.Contract(CONTRACT_ADDRESS, GAME_ABI, userSigner);
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, readProvider);

      setAccount(addr);
      setSigner(userSigner);
      setProvider(readProvider);
      setGameContract(game);
      setTokenContract(token);

      // Update balance
      const bal = await token.balanceOf(addr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));

      // Listen for payout events
      game.on("Payout", async (winner, amount) => {
        if (winner.toLowerCase() === addr.toLowerCase()) {
          const tokenAmount = parseFloat(ethers.formatEther(amount)).toFixed(2);
          alert(`🎉 YOU WON ${tokenAmount} CGT!`);
          const newBal = await token.balanceOf(addr);
          setBalance(parseFloat(ethers.formatEther(newBal)).toFixed(2));
        }
      });

    } catch (err) {
      console.error(err);
      alert("Connection failed: " + err.message);
    }
  };

  // Mint tokens (for testing)
  const mintTokens = async () => {
    if (!tokenContract || !signer || !account) return;

    try {
      const tokenWithSigner = tokenContract.connect(signer);
      const tx = await tokenWithSigner.mint(account, ethers.parseEther("1000"));
      alert("⏳ Minting 1000 CGT...");
      await tx.wait();

      await new Promise(r => setTimeout(r, 2000));
      const bal = await tokenContract.balanceOf(account);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));
      alert("✅ Minted 1000 CGT!");
    } catch (e) {
      console.error(e);
      alert("Mint failed: " + (e.reason || e.message));
    }
  };

  // Place Bet
  const handleBet = async () => {
    if (!gameContract || !tokenContract || !signer || !account) {
      return alert("Please connect your wallet first");
    }
    if (!currentRound || currentRound.status !== "OPEN") {
      return alert("Betting is closed for this round");
    }
    if (!selectedColor) {
      return alert("Please select a color");
    }
    if (!betAmount || parseFloat(betAmount) <= 0) {
      return alert("Please enter a valid amount");
    }

    setIsBetting(true);
    const amountWei = ethers.parseEther(betAmount.toString());

    try {
      // Check allowance
      const tokenWithSigner = tokenContract.connect(signer);
      const allowance = await tokenWithSigner.allowance(account, CONTRACT_ADDRESS);

      if (allowance < amountWei) {
        alert("✋ Requesting approval...");
        const approveTx = await tokenWithSigner.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
        alert("✅ Approved!");
      }

      // Place bet
      alert("🎲 Placing bet...");
      const balanceBefore = await tokenContract.balanceOf(account);

      const tx = await gameContract.placeBet(
        currentRound.id,
        COLOR_MAP[selectedColor],
        amountWei
      );
      await tx.wait();

      const balanceAfter = await tokenContract.balanceOf(account);

      setMyBet({
        roundId: currentRound.id,
        color: selectedColor,
        amount: betAmount,
        balanceBefore: ethers.formatEther(balanceBefore),
        balanceAfter: ethers.formatEther(balanceAfter),
      });

      alert(`✅ Bet placed: ${betAmount} CGT on ${selectedColor}`);

      // Update balance
      setBalance(parseFloat(ethers.formatEther(balanceAfter)).toFixed(2));

    } catch (error) {
      console.error(error);
      alert(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setIsBetting(false);
    }
  };

  // Load current round from Supabase
  const loadRound = async () => {
    const { data } = await supabase
      .from("rounds")
      .select("*")
      .order("id", { ascending: false })
      .limit(1);

    if (!data?.length) return;
    const newRound = data[0];

    // Check if round was resolved
    if (currentRound && currentRound.status !== "RESOLVED" && newRound.status === "RESOLVED") {
      handleResult(newRound);
    }

    setCurrentRound(newRound);
  };

  // Load result history
  const loadResultHistory = async () => {
    const { data } = await supabase
      .from("round_results_history")
      .select("*")
      .order("id", { ascending: false })
      .limit(12);

    if (data) {
      setLastResults(data.map(r => r.color.toUpperCase()));
    }
  };

  // Handle round result
  const handleResult = async (round) => {
    const winningColor = round.result_color?.toUpperCase();
    if (!myBet || myBet.roundId !== round.id || !tokenContract || !account) return;

    await new Promise(resolve => setTimeout(resolve, 2000));
    const finalBalance = await tokenContract.balanceOf(account);
    const won = myBet.color === winningColor;
    let winLossAmount;

    if (won) {
      const multiplier = winningColor === "VIOLET" ? 5 : 2;
      const winAmount = (parseFloat(myBet.amount) * multiplier).toFixed(2);
      winLossAmount = "+" + winAmount;
      alert(`🎉 YOU WON ${winLossAmount} CGT!`);
    } else {
      winLossAmount = "-" + myBet.amount;
      alert(`😢 YOU LOST ${myBet.amount} CGT.`);
    }

    const newHistoryItem = {
      roundId: round.id,
      bet: myBet.amount,
      color: myBet.color,
      result: winningColor,
      balanceBefore: myBet.balanceBefore,
      balanceAfter: ethers.formatEther(finalBalance),
      winLoss: winLossAmount,
      won: won,
    };

    setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
    setBalance(parseFloat(ethers.formatEther(finalBalance)).toFixed(2));
    setMyBet(null);
  };

  // Timer effect
  useEffect(() => {
    if (!currentRound) return;

    const timer = setInterval(() => {
      const remaining = Math.floor((new Date(currentRound.end_time) - new Date()) / 1000);
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRound]);

  // Subscribe to Supabase realtime updates
  useEffect(() => {
    loadRound();
    loadResultHistory();

    const roundsChannel = supabase
      .channel("rounds-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, loadRound)
      .subscribe();

    const historyChannel = supabase
      .channel("history-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "round_results_history" }, loadResultHistory)
      .subscribe();

    return () => {
      roundsChannel.unsubscribe();
      historyChannel.unsubscribe();
    };
  }, []);

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
                  <div className="font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Balance</div>
                  <div className="font-bold text-lg">{balance} CGT</div>
                </div>
                <button
                  onClick={mintTokens}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  💰 Mint 1000 CGT
                </button>
              </div>
            )}
          </div>

          {/* Round Info */}
          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-gray-400 text-sm">Round </span>
                <span className="text-3xl font-bold text-blue-400">{currentRound?.id || '---'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-400">{currentRound?.status || 'LOADING'}</span>
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
              disabled={!selectedColor || !betAmount || isBetting || !account}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
            >
              <span>🎲</span>
              {isBetting ? 'Processing...' : 'Place Bet'}
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
              <span className="text-xs text-gray-500">{lastResults.length}</span>
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
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">TOTAL BETS</div>
                <div className="text-lg font-bold">{history.length}</div>
              </div>
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">WINS</div>
                <div className="text-lg font-bold text-green-400">{history.filter(h => h.won).length}</div>
              </div>
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">LOSSES</div>
                <div className="text-lg font-bold text-red-400">{history.filter(h => !h.won).length}</div>
              </div>
              <div className="bg-[#0a0e27] p-2 rounded-lg">
                <div className="text-xs text-gray-400">NET P/L</div>
                <div className="text-lg font-bold text-orange-400">
                  {history.reduce((sum, h) => sum + parseFloat(h.winLoss), 0).toFixed(2)} CGT
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#1a1f3a]">
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2">ROUND</th>
                    <th className="text-left py-2">BET</th>
                    <th className="text-left py-2">COLOR</th>
                    <th className="text-left py-2">RESULT</th>
                    <th className="text-right py-2">WIN/LOSS</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-500">
                        No bets yet. Place your first bet!
                      </td>
                    </tr>
                  ) : (
                    history.map((h, i) => (
                      <tr key={i} className={clsx("border-b border-gray-800", h.won ? "bg-green-500/5" : "bg-red-500/5")}>
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
                        <td className={clsx("py-2 text-right font-bold", h.won ? "text-green-400" : "text-red-400")}>
                          {h.winLoss}
                        </td>
                      </tr>
                    ))
                  )}
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
