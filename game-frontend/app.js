import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";

console.log("✅ app.js loaded");

const connectBtn = document.getElementById("connectBtn");
const walletSpan = document.getElementById("wallet");
const balanceSpan = document.getElementById("balance");

connectBtn.onclick = async () => {
  try {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    console.log("🔌 Connecting wallet...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);

    walletSpan.innerText =
      address.slice(0, 6) + "..." + address.slice(-4);

    balanceSpan.innerText =
      ethers.formatEther(balance);

    console.log("✅ Connected:", address);

  } catch (err) {
    console.error("❌ Wallet error:", err);
    alert("Wallet connection failed");
  }
};
