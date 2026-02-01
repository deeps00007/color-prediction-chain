import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GameBoard from './components/GameBoard';
import BettingPanel from './components/BettingPanel';
import HistoryPanel from './components/HistoryPanel';
import { ethers } from 'ethers';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.00');

  // Game State
  const [roundId, setRoundId] = useState(602);
  const [status, setStatus] = useState('OPEN');
  const [timeLeft, setTimeLeft] = useState(30);

  const [history, setHistory] = useState([
    { roundId: 601, betColor: 'RED', betAmount: '10', resultColor: 'RED', won: true, winAmount: '20' },
    { roundId: 600, betColor: 'GREEN', betAmount: '5', resultColor: 'RED', won: false, winAmount: '0' },
  ]);

  useEffect(() => {
    // Mock Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 30; // Reset loop
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
      setBalance('1000.00');
    } catch (err) {
      console.error(err);
      alert("Connection failed");
    }
  };

  const handleBet = (color, amount) => {
    // Add fake bet to history
    console.log(`Betting ${amount} on ${color}`);
    const newBet = {
      roundId: roundId,
      betColor: color,
      betAmount: amount,
      resultColor: 'PENDING',
      won: false,
      winAmount: '0'
    };
    setHistory((prev) => [newBet, ...prev]);
  };

  return (
    <div className="min-h-screen relative bg-slate-950 text-white selection:bg-violet-500/30 font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto pb-12">
        <Navbar onConnect={connectWallet} account={account} balance={balance} />

        <main className="px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Game Board & Betting */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <GameBoard roundId={roundId} status={status} timeLeft={timeLeft} />
              <BettingPanel onBet={handleBet} isBetting={false} />
            </div>
          </div>

          {/* Right Panel: History */}
          <div className="lg:col-span-4 space-y-6">
            <HistoryPanel history={history} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
