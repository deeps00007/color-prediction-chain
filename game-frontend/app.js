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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===== DOM ===== */

const connectBtn = document.getElementById("connectBtn");
const betBtn = document.getElementById("betBtn");

const walletSpan = document.getElementById("wallet");
const balanceSpan = document.getElementById("balance");
const roundIdSpan = document.getElementById("roundId");
const roundStatusSpan = document.getElementById("roundStatus");

const amountInput = document.getElementById("betAmount");
const msg = document.getElementById("msg");
const selectedText = document.getElementById("selected");

const colorButtons = document.querySelectorAll(".color-btn");

/* ===== STATE ===== */

let provider;
let signer;
let contract;
let userAddress;
let currentRound = null;
let selectedColor = null;

/* ===== CONNECT WALLET ===== */

connectBtn.onclick = async () => {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  walletSpan.innerText =
    userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

  await loadBalance();
};

/* ===== BALANCE ===== */

async function loadBalance() {
  const bal = await provider.getBalance(userAddress);
  balanceSpan.innerText = ethers.formatEther(bal);
}

/* ===== LOAD ROUND ===== */

async function loadRound() {
  const { data } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (!data || !data.length) return;

  currentRound = data[0];
  roundIdSpan.innerText = currentRound.id;
  roundStatusSpan.innerText = currentRound.status;
}

loadRound();

/* ===== REALTIME ===== */

supabase
  .channel("rounds-live")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "rounds" },
    () => loadRound()
  )
  .subscribe();

/* ===== COLOR SELECT ===== */

colorButtons.forEach(btn => {
  btn.onclick = () => {
    colorButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedColor = btn.dataset.color;
    selectedText.innerText = `Selected: ${btn.innerText}`;
  };
});

/* ===== PLACE BET ===== */

betBtn.onclick = async () => {
  if (!contract) {
    msg.innerText = "Connect wallet first";
    return;
  }

  if (!currentRound || currentRound.status !== "OPEN") {
    msg.innerText = "Betting closed";
    return;
  }

  if (selectedColor === null) {
    msg.innerText = "Select a color";
    return;
  }

  const amount = amountInput.value;
  if (!amount || Number(amount) <= 0) {
    msg.innerText = "Invalid amount";
    return;
  }

  try {
    msg.innerText = "⏳ Sending transaction...";

    const tx = await contract.placeBet(
      currentRound.id,
      Number(selectedColor),
      { value: ethers.parseEther(amount) }
    );

    await tx.wait();
    await loadBalance();

    msg.innerText = "✅ Bet placed";

  } catch (err) {
    console.error(err);
    msg.innerText = "❌ Transaction failed";
  }
};
