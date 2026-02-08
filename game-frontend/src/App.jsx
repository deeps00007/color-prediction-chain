import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ethers } from 'ethers';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ColorGame from './pages/ColorGame';
import PlinkoGame from './pages/PlinkoGame';

import {
  CONTRACT_ADDRESS,
  TOKEN_ADDRESS,
  GAME_ABI,
  TOKEN_ABI,
  RPC_URLS
} from './config';

// Layout Wrapper
function Layout({
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
  wakeUpServer,
  message
}) {
  return (
    <div className={clsx("h-screen flex flex-col overflow-hidden", isDarkMode ? "bg-gray-900" : "bg-gray-50")}>
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        account={account}
        balance={balance}
        connectWallet={connectWallet}
        isConnecting={isConnecting}
        isMobile={isMobile}
        setShowHelpModal={setShowHelpModal}
        mintTokens={mintTokens}
        mintAmount={mintAmount}
        setMintAmount={setMintAmount}
        wakeUpServer={wakeUpServer}
      />

      {/* Pages Render Here */}
      <Outlet />

      {/* Global Toast */}
      <AnimatePresence>
        {message.text && (
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
        )}
      </AnimatePresence>

      {/* Floating Gas Button (Global) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Button Logic is simplified here, assume it's same as previously implemented but cleaner */}
        <a
          href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95 no-underline"
          title="Get Sepolia Gas"
        >
          ⛽
        </a>
      </div>
    </div>
  );
}

function App() {
  // Global State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const [isMobile, setIsMobile] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mintAmount, setMintAmount] = useState('1000');

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [gameContract, setGameContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      return showMessage("Please install MetaMask", 'error');
    }
    setIsConnecting(true);

    try {
      // 1. Force Sepolia Chain
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: RPC_URLS,
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            });
          } catch (addError) {
            console.error("Failed to add chain:", addError);
          }
        }
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      const addr = await userSigner.getAddress();

      const readProvider = new ethers.JsonRpcProvider(RPC_URLS[0]);
      const game = new ethers.Contract(CONTRACT_ADDRESS, GAME_ABI, userSigner);
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, readProvider);

      setAccount(addr);
      setSigner(userSigner);
      setProvider(readProvider);
      setGameContract(game);
      setTokenContract(token);

      const bal = await token.balanceOf(addr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));

      // Global Listeners? Maybe moved to specific games.

      showMessage("Wallet connected", 'success');
    } catch (err) {
      console.error(err);
      showMessage("Connection failed", 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const mintTokens = async () => {
    if (!tokenContract || !signer || !account) return;
    try {
      const tokenWithSigner = tokenContract.connect(signer);
      const tx = await tokenWithSigner.mint(account, ethers.parseEther(mintAmount.toString()));
      showMessage("Minting...", 'info');
      await tx.wait();
      const bal = await tokenContract.balanceOf(account);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));
      showMessage(`${mintAmount} CGT minted`, 'success');
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

  return (
    <BrowserRouter>
      <Routes>
        <Route element={
          <Layout
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            account={account}
            balance={balance}
            connectWallet={connectWallet}
            isConnecting={isConnecting}
            isMobile={isMobile}
            setShowHelpModal={setShowHelpModal}
            mintTokens={mintTokens}
            mintAmount={mintAmount}
            setMintAmount={setMintAmount}
            wakeUpServer={wakeUpServer}
            message={message}
          />
        }>
          <Route path="/" element={<Dashboard isDarkMode={isDarkMode} />} />
          <Route path="/color-prediction" element={
            <ColorGame
              isDarkMode={isDarkMode}
              account={account}
              signer={signer}
              tokenContract={tokenContract}
              gameContract={gameContract}
              showMessage={showMessage}
              balance={balance}
              setBalance={setBalance}
            />
          } />
          <Route path="/plinko" element={
            <PlinkoGame
              isDarkMode={isDarkMode}
              showMessage={showMessage}
              account={account}
              balance={balance}
              setBalance={setBalance}
              signer={signer}
              tokenContract={tokenContract}
            />
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
