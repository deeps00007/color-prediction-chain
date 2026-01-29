import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

console.log("✅ app.js loaded");

/* ===== CONFIG ===== */

const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const ABI = [
  "function placeBet(uint256 roundId, uint8 color) payable"
];

const SUPABASE_URL = "https://zskfvqfszulwuhshzuxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U";


/* ===== SUPABASE ===== */

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===== DOM ===== */

const connectBtn = document.getElementById("connectBtn");
const walletSpan = document.getElementById("wallet");
const balanceSpan = document.getElementById("balance");
const roundIdSpan = document.getElementById("roundId");
const roundStatusSpan = document.getElementById("roundStatus");

/* ===== STATE ===== */

let provider;
let signer;
let contract;
let userAddress;
let currentRound = null;

/* ===== CONNECT WALLET ===== */

connectBtn.onclick = async () => {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    signer
  );

  walletSpan.innerText =
    userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

  await loadBalance();
};

/* ===== BALANCE ===== */

async function loadBalance() {
  const bal = await provider.getBalance(userAddress);
  balanceSpan.innerText = ethers.formatEther(bal);
}

/* ===== LOAD CURRENT ROUND ===== */

async function loadRound() {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data.length) return;

  currentRound = data[0];

  roundIdSpan.innerText = currentRound.id;
  roundStatusSpan.innerText = currentRound.status;

  console.log("🎯 Current round:", currentRound.id);
}

loadRound();

/* ===== REALTIME ROUND UPDATES ===== */

supabase
  .channel("round-updates")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "rounds" },
    payload => {
      console.log("🔄 Round update received");
      loadRound();
    }
  )
  .subscribe();

/* ===== BET ===== */

window.placeTestBet = async () => {
  if (!currentRound) {
    alert("Round not loaded");
    return;
  }

  if (currentRound.status !== "OPEN") {
    alert("Betting is closed");
    return;
  }

  try {
    const tx = await contract.placeBet(
      currentRound.id, // 🔥 REAL ROUND ID
      0,               // RED (for now)
      { value: ethers.parseEther("0.01") }
    );

    await tx.wait();
    await loadBalance();

    alert("✅ Bet placed");

  } catch (err) {
    console.error(err);
    alert("❌ Bet failed");
  }
};
