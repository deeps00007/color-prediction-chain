import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ========= CONFIG ========= */

const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const ABI = [
  "function placeBet(uint256 roundId, uint8 color) payable",
  "function resolveRound(uint256 roundId, uint8 result) external",
  "function getBet(uint256 roundId, address user) view returns (uint8, uint256, bool)",
  "function calculatePayout(uint256 amount, uint8 color) pure returns (uint256)",
  "function rounds(uint256) view returns (uint8 status, uint8 result, bool resolved)",
  "event BetPlaced(uint256 indexed roundId, address indexed user, uint8 color, uint256 amount)",
  "event RoundResolved(uint256 indexed roundId, uint8 result)",
  "event Payout(address indexed user, uint256 amount)"
];

const COLOR_MAP = { RED: 0, GREEN: 1, VIOLET: 2 };

const supabase = createClient(
  "https://zskfvqfszulwuhshzuxa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U"
);

/* ========= DOM ========= */

const walletSpan = document.getElementById("wallet");
const balanceSpan = document.getElementById("balance");
const roundIdSpan = document.getElementById("roundId");
const roundStatusSpan = document.getElementById("roundStatus");
const timerSpan = document.getElementById("timer");
const msg = document.getElementById("msg");
const resultsDiv = document.getElementById("results");

/* ========= STATE ========= */

let provider, signer, contract, user;
let currentRound = null;
let selectedColor = null;
let myBet = null;
let timerInterval = null;

/* ========= WALLET ========= */

document.getElementById("connectBtn").onclick = async () => {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  user = await signer.getAddress();

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  walletSpan.textContent = user.slice(0, 6) + "..." + user.slice(-4);
  balanceSpan.textContent = ethers.formatEther(
    await provider.getBalance(user)
  );

  // Listen for Payout events
  contract.on("Payout", async (winner, amount) => {
    if (winner.toLowerCase() === user.toLowerCase()) {
      const ethAmount = ethers.formatEther(amount);
      msg.textContent = `🎉 YOU WON ${ethAmount} ETH!`;
      msg.style.color = "#2ecc71";
      setTimeout(() => { msg.style.color = ""; }, 5000);
      
      // Update balance
      balanceSpan.textContent = ethers.formatEther(
        await provider.getBalance(user)
      );
    }
  });
};

/* ========= ROUND ========= */

async function loadRound() {
  const { data } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (!data.length) return;

  const newRound = data[0];

  // 🔥 detect resolution
  if (
    currentRound &&
    currentRound.status !== "RESOLVED" &&
    newRound.status === "RESOLVED"
  ) {
    handleResult(newRound);
  }

  currentRound = newRound;

  roundIdSpan.textContent = currentRound.id;
  roundStatusSpan.textContent = currentRound.status;

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const remaining = Math.floor(
      (new Date(currentRound.end_time) - new Date()) / 1000
    );

    timerSpan.textContent = remaining > 0 ? remaining : "0";
  }, 1000);
}

/* ========= REALTIME ========= */

supabase
  .channel("rounds-live")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "rounds" },
    loadRound
  )
  .subscribe();

/* ========= BETTING ========= */

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
  if (!selectedColor) return alert("Select a color");

  const amount = document.getElementById("amount").value;

  msg.textContent = "⏳ Sending transaction...";

  const tx = await contract.placeBet(
    currentRound.id,
    COLOR_MAP[selectedColor],
    { value: ethers.parseEther(amount) }
  );

  await tx.wait();

  myBet = {
    roundId: currentRound.id,
    color: selectedColor,
    amount
  };

  msg.textContent = "🎯 Bet placed. Waiting for result...";
};

/* ========= RESULT HANDLER ========= */

function handleResult(round) {
  const winningColor = round.result_color;

  // highlight winning color
  document.querySelectorAll(".color").forEach(btn => {
    btn.classList.remove("selected");
    if (btn.dataset.color === winningColor) {
      btn.classList.add("selected");
    }
  });

  if (!myBet || myBet.roundId !== round.id) {
    msg.textContent = `🏁 Result: ${winningColor}`;
    return;
  }

  if (myBet.color === winningColor) {
    const multiplier = winningColor === "VIOLET" ? 5 : 2;
    const winAmount = (parseFloat(myBet.amount) * multiplier).toFixed(4);
    msg.textContent = `🎉 YOU WON ${winAmount} ETH!`;
    msg.style.color = "#2ecc71";
  } else {
    msg.textContent = `❌ YOU LOST ${myBet.amount} ETH. Result: ${winningColor}`;
    msg.style.color = "#e74c3c";
  }

  setTimeout(() => { msg.style.color = ""; }, 5000);
  myBet = null;
}

/* ========= HISTORY ========= */

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
  .channel("history-live")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "round_results_history" },
    loadHistory
  )
  .subscribe();

/* ========= INIT ========= */

loadRound();
loadHistory();
