// import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
// import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// console.log("✅ app.js loaded");

// /* ===== CONFIG ===== */

// const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// const ABI = [
//   "function placeBet(uint256 roundId, uint8 color) payable"
// ];

// const SUPABASE_URL = "https://zskfvqfszulwuhshzuxa.supabase.co";
// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U";


import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ===== CONFIG ===== */

const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const ABI = [
  "function placeBet(uint256 roundId, uint8 color) payable"
];

const COLOR_MAP = { RED: 0, GREEN: 1, VIOLET: 2 };

const supabase = createClient(
  "https://zskfvqfszulwuhshzuxa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U"
);

/* ===== DOM ===== */

const walletSpan = document.getElementById("wallet");
const balanceSpan = document.getElementById("balance");
const roundIdSpan = document.getElementById("roundId");
const roundStatusSpan = document.getElementById("roundStatus");
const timerSpan = document.getElementById("timer");
const resultsDiv = document.getElementById("results");
const msg = document.getElementById("msg");

/* ===== STATE ===== */

let provider, signer, contract, user;
let currentRound = null;
let selectedColor = null;
let timerInterval = null;

/* ===== WALLET ===== */

document.getElementById("connectBtn").onclick = async () => {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  user = await signer.getAddress();

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  walletSpan.textContent = user.slice(0, 6) + "..." + user.slice(-4);
  balanceSpan.textContent = ethers.formatEther(
    await provider.getBalance(user)
  );
};

/* ===== ROUND LOADING ===== */

async function loadRound() {
  const { data } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (!data.length) return;

  currentRound = data[0];
  roundIdSpan.textContent = currentRound.id;
  roundStatusSpan.textContent = currentRound.status;

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const remaining =
      Math.floor(
        (new Date(currentRound.end_time) - new Date()) / 1000
      );

    timerSpan.textContent = remaining > 0 ? remaining : "0";
  }, 1000);
}

/* ===== REALTIME ===== */

supabase
  .channel("round-live")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "rounds" },
    loadRound
  )
  .subscribe();

/* ===== BETTING ===== */

document.querySelectorAll(".color").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".color").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedColor = btn.dataset.color;
  };
});

document.getElementById("betBtn").onclick = async () => {
  if (!contract) return alert("Connect wallet");
  if (!currentRound || currentRound.status !== "OPEN")
    return alert("Betting closed");

  const amount = document.getElementById("amount").value;

  msg.textContent = "⏳ Sending tx...";

  const tx = await contract.placeBet(
    currentRound.id,
    COLOR_MAP[selectedColor],
    { value: ethers.parseEther(amount) }
  );

  await tx.wait();
  msg.textContent = "✅ Bet placed";
};

/* ===== HISTORY ===== */

async function loadHistory() {
  const { data } = await supabase
    .from("round_results_history")
    .select("*")
    .order("id", { ascending: false })
    .limit(10);

  resultsDiv.innerHTML = "";

  data.forEach(r => {
    const dot = document.createElement("div");
    dot.className = `result ${r.color.toLowerCase()}`;
    resultsDiv.appendChild(dot);
  });
}

supabase
  .channel("history")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "round_results_history" },
    loadHistory
  )
  .subscribe();

/* ===== INIT ===== */

loadRound();
loadHistory();
