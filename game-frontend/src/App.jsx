import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  const [isMobile, setIsMobile] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mintAmount, setMintAmount] = useState('1000'); // Default mint amount

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [gameContract, setGameContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [currentRound, setCurrentRound] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState(null);
  const [betAmount, setBetAmount] = useState('10');
  const [isBetting, setIsBetting] = useState(false);
  const [myBet, setMyBet] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [history, setHistory] = useState([]);
  const [lastResults, setLastResults] = useState([]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      if (isMobile) {
        setShowHelpModal(true);
        return;
      }
      return showMessage("Please install MetaMask browser extension", 'error');
    }
    setIsConnecting(true);

    try {
      const selectedRpc = RPC_URLS[Math.floor(Math.random() * RPC_URLS.length)];

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
      } catch (e) { }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      const addr = await userSigner.getAddress();

      const readProvider = new ethers.JsonRpcProvider(selectedRpc);
      const game = new ethers.Contract(CONTRACT_ADDRESS, GAME_ABI, userSigner);
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, readProvider);

      setAccount(addr);
      setSigner(userSigner);
      setProvider(readProvider);
      setGameContract(game);
      setTokenContract(token);

      const bal = await token.balanceOf(addr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));

      game.on("Payout", async (winner, amount) => {
        if (winner.toLowerCase() === addr.toLowerCase()) {
          showMessage(`You won ${parseFloat(ethers.formatEther(amount)).toFixed(2)} CGT!`, 'success');
          const newBal = await token.balanceOf(addr);
          setBalance(parseFloat(ethers.formatEther(newBal)).toFixed(2));
        }
      });

      showMessage("Wallet connected", 'success');
    } catch (err) {
      showMessage(err.code === 4001 ? "Connection rejected" : "Connection failed", 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const mintTokens = async () => {
    if (!tokenContract || !signer || !account) return;
    if (!mintAmount || parseFloat(mintAmount) <= 0) return showMessage("Enter valid amount", 'error');

    try {
      const tokenWithSigner = tokenContract.connect(signer);
      const tx = await tokenWithSigner.mint(account, ethers.parseEther(mintAmount.toString()));
      showMessage("Minting tokens...", 'info');
      await tx.wait();
      await new Promise(r => setTimeout(r, 2000));
      const bal = await tokenContract.balanceOf(account);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));
      showMessage(`${mintAmount} CGT minted successfully`, 'success');
    } catch (e) {
      showMessage("Mint failed", 'error');
    }
  };

  const wakeUpServer = async () => {
    try {
      showMessage("Waking up server...", 'info');
      await fetch('https://color-prediction-chain.onrender.com/');
      showMessage("Server active", 'success');
    } catch (e) {
      showMessage("Server check failed", 'error');
    }
  };

  const addToWallet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: TOKEN_ADDRESS,
            symbol: 'CGT',
            decimals: 18,
          },
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

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
      loadUserBets(); // Refresh history immediately

    } catch (error) {
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
      setIsLoading(false);
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
    const resultString = round.result_color?.toUpperCase(); // "RED" or "VIOLET+RED"
    if (!myBet || myBet.roundId !== round.id || !tokenContract || !account || !resultString) return;

    await new Promise(resolve => setTimeout(resolve, 2000));
    const finalBalance = await tokenContract.balanceOf(account);

    // Check if bet color is in the result string (split by +)
    const winningColors = resultString.split('+');
    const won = winningColors.includes(myBet.color);

    const multiplier = myBet.color === "VIOLET" ? 5 : 2;
    const winLossAmount = won ? `+${(parseFloat(myBet.amount) * multiplier).toFixed(2)}` : `-${myBet.amount}`;

    showMessage(won ? `You won ${winLossAmount} CGT!` : `You lost ${myBet.amount} CGT`, won ? 'success' : 'error');

    await loadUserBets(); // Refresh history from chain/db to ensure accuracy

    setBalance(parseFloat(ethers.formatEther(finalBalance)).toFixed(2));
    setMyBet(null);
  };

  useEffect(() => {
    if (!currentRound) return;
    const timer = setInterval(() => {
      const remaining = Math.floor((new Date(currentRound.end_time) - new Date()) / 1000);
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentRound]);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || isTouchDevice);
    };

    const tryAutoConnect = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            connectWallet();
          }
        } catch (e) {
          console.error("Auto-connect failed:", e);
        }
      }
    };

    checkMobile();
    tryAutoConnect();
    loadRound();
    loadResultHistory();

    const roundsChannel = supabase.channel("rounds-live").on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, loadRound).subscribe();
    const historyChannel = supabase.channel("history-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "round_results_history" }, loadResultHistory).subscribe();

    return () => {
      roundsChannel.unsubscribe();
      historyChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (account && gameContract) {
      loadUserBets();
    }
  }, [account, gameContract]);

  const loadUserBets = async () => {
    if (!gameContract || !account) return;

    try {
      // 1. Fetch BetPlaced events for current user
      const filter = gameContract.filters.BetPlaced(null, account);
      const events = await gameContract.queryFilter(filter);

      // 2. Fetch all relevant round results from Supabase
      const roundIds = events.map(e => e.args[0].toString());
      if (roundIds.length === 0) return;

      const { data: roundsData } = await supabase
        .from("rounds")
        .select("id, result_color")
        .in("id", roundIds);

      const roundsMap = {};
      roundsData?.forEach(r => roundsMap[r.id] = r.result_color);

      // 3. Combine data
      const historyItems = events.map(e => {
        const roundId = e.args[0].toString();
        const colorCode = Number(e.args[2]); // 0=RED, 1=GREEN, 2=VIOLET
        const amountWei = e.args[3];

        let colorName = 'RED';
        if (colorCode === 1) colorName = 'GREEN';
        if (colorCode === 2) colorName = 'VIOLET';

        const resultColor = roundsMap[roundId]?.toUpperCase();
        const betAmount = ethers.formatEther(amountWei);

        let won = false;
        let winLossAmount = `-${betAmount}`;

        if (resultColor) {
          const winningColors = resultColor.split('+');
          if (winningColors.includes(colorName)) {
            won = true;
            const multiplier = colorName === "VIOLET" ? 5 : 2;
            winLossAmount = `+${(parseFloat(betAmount) * multiplier).toFixed(2)}`;
          }
        }

        return {
          roundId,
          bet: betAmount,
          color: colorName,
          result: resultColor,
          winLoss: winLossAmount,
          won: won,
          // Only show result if the round has a result
          isPending: !resultColor
        };
      });

      // Sort by roundId descending
      historyItems.sort((a, b) => b.roundId - a.roundId);
      setHistory(historyItems);

    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  if (isLoading) {
    return (
      <div className={clsx("h-screen flex items-center justify-center", isDarkMode ? "bg-gray-900" : "bg-gray-50")}>
        <div className={clsx(isDarkMode ? "text-gray-300" : "text-gray-600")}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={clsx("h-screen flex flex-col overflow-hidden", isDarkMode ? "bg-gray-900" : "bg-gray-50")}>
      {/* Header */}
      <header className={clsx("border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            CP
          </div>
          <div>
            <h1 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>Color Prediction</h1>
            <p className={clsx("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>Round #{currentRound?.id || '---'}</p>
          </div>
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
              <div className="text-right">
                <div className={clsx("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>Your Balance</div>
                <div className="flex items-center gap-2">
                  <div className={clsx("text-lg font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{balance} <span className={clsx("text-sm font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>CGT</span></div>
                  <button onClick={addToWallet} className="text-xs p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors" title="Add to MetaMask">
                    🦊
                  </button>
                </div>
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
              <div className={clsx("px-4 py-2 rounded-lg text-sm font-mono border", isDarkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-gray-100 text-gray-700 border-gray-300")}>
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
      </header >

      {/* Toast */}
      < AnimatePresence >
        {
          message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={clsx(
                "fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium",
                message.type === 'success' && "bg-green-50 text-green-800 border border-green-200",
                message.type === 'error' && "bg-red-50 text-red-800 border border-red-200",
                message.type === 'info' && "bg-blue-50 text-blue-800 border border-blue-200"
              )}
            >
              {message.text}
            </motion.div>
          )
        }
      </AnimatePresence >



      {/* Help Modal */}
      < AnimatePresence >
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx("max-w-md w-full rounded-xl p-6 shadow-2xl", isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200")}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                  Connect Wallet on Mobile
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className={clsx("text-2xl leading-none", isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")}
                >
                  ×
                </button>
              </div>

              <div className={clsx("space-y-4 text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                <div className={clsx("p-3 rounded-lg", isDarkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200")}>
                  <p className={clsx("font-semibold mb-1", isDarkMode ? "text-blue-300" : "text-blue-900")}>
                    📱 MetaMask Mobile App Required
                  </p>
                  <p className={clsx(isDarkMode ? "text-blue-200" : "text-blue-700")}>
                    To use this app on mobile, you need the MetaMask mobile app.
                  </p>
                </div>

                <div>
                  <h4 className={clsx("font-semibold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>
                    Step 1: Download MetaMask
                  </h4>
                  <p className="mb-2">Download the official MetaMask app:</p>
                  <div className="flex gap-2">
                    <a
                      href="https://apps.apple.com/app/metamask/id1438144202"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-center text-xs font-medium hover:bg-gray-800"
                    >
                      📱 App Store
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=io.metamask"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-center text-xs font-medium hover:bg-green-700"
                    >
                      🤖 Play Store
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className={clsx("font-semibold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>
                    Step 2: Open in MetaMask Browser
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open the MetaMask app</li>
                    <li>Tap the <strong>menu icon (☰)</strong> in the top left</li>
                    <li>Select <strong>"Browser"</strong></li>
                    <li>Enter this website's URL in the address bar</li>
                    <li>Tap <strong>"Connect Wallet"</strong> on the site</li>
                  </ol>
                </div>

                <div className={clsx("p-3 rounded-lg border", isDarkMode ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-200")}>
                  <p className={clsx("text-xs", isDarkMode ? "text-yellow-200" : "text-yellow-800")}>
                    <strong>Note:</strong> You must use the MetaMask app's built-in browser. Regular browsers (Safari, Chrome) won't work.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full mt-6 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )
        }
      </AnimatePresence >

      {/* Main Content */}
      < div className="flex-1 overflow-y-auto p-6" >
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
                        (result === 'VIOLET' || result === 'VIOLET+RED') && "bg-[linear-gradient(135deg,#9333ea_50%,#ef4444_50%)]",
                        result === 'VIOLET+GREEN' && "bg-[linear-gradient(135deg,#9333ea_50%,#22c55e_50%)]"
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
      </div >
    </div >
  );
}

export default App;
