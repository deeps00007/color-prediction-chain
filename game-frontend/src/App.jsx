import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { ethers } from 'ethers';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.00');

  // Placeholder for connection logic - will move to hook later
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);
      // Fake balance for now until contract hooked up
      setBalance('100.00');
    } catch (err) {
      console.error(err);
      alert("Connection failed");
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-950 text-white selection:bg-violet-500/30">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto pb-12">
        <Navbar onConnect={connectWallet} account={account} balance={balance} />

        <main className="px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Game Board & Betting */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-8 rounded-3xl min-h-[400px] flex items-center justify-center border-l-4 border-l-violet-500">
              <h2 className="text-3xl font-bold text-slate-500/50">Game Board Coming Soon</h2>
            </div>

            <div className="glass-panel p-8 rounded-3xl min-h-[200px] flex items-center justify-center">
              <h2 className="text-2xl font-bold text-slate-500/50">Betting Controls</h2>
            </div>
          </div>

          {/* Right Panel: History */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl h-full min-h-[600px]">
              <h3 className="text-xl font-bold mb-4 font-display">Recent History</h3>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 flex justify-between animate-pulse">
                    <div className="w-1/3 h-4 bg-white/10 rounded" />
                    <div className="w-1/4 h-4 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
