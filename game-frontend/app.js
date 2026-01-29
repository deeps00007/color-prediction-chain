import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const ABI = [
  "function placeBet(uint256 roundId, uint8 color) payable",
  "function resolveRound(uint256 roundId, uint8 result) external",
  "function getBet(uint256 roundId, address user) view returns (uint8, uint256, bool)",
  "function calculatePayout(uint256 amount, uint8 color) pure returns (uint256)",
  "function rounds(uint256) view returns (uint8 status, uint8 result, bool resolved)",
  "event BetPlaced(uint256 indexed roundId, address indexed user, uint8 color, uint256 amount)",
  "event RoundResolved(uint256 indexed roundId, uint8 result)",
  "event Payout(address indexed user, uint256 amount)",
];
const COLOR_MAP = { RED: 0, GREEN: 1, VIOLET: 2 };
const supabase = createClient(
  "https://zskfvqfszulwuhshzuxa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U",
);
const walletSpan = document.getElementById("wallet");
const balanceSpan = document.getElementById("balance");
const roundIdSpan = document.getElementById("roundId");
const roundStatusSpan = document.getElementById("roundStatus");
const timerSpan = document.getElementById("timer");
const msg = document.getElementById("msg");
const resultsDiv = document.getElementById("results");
const historyBody = document.getElementById("historyBody");
let provider, signer, contract, user;
let currentRound = null;
let selectedColor = null;
let myBet = null;
let timerInterval = null;
let bettingHistory = [];
function loadHistoryFromStorage() {
  const saved = localStorage.getItem("bettingHistory");
  if (saved) {
    bettingHistory = JSON.parse(saved);
    renderHistory();
  }
}
function saveHistoryToStorage() {
  localStorage.setItem("bettingHistory", JSON.stringify(bettingHistory));
}
loadHistoryFromStorage();
document.getElementById("connectBtn").onclick = async () => {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  user = await signer.getAddress();
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  walletSpan.textContent = user.slice(0, 6) + "..." + user.slice(-4);
  balanceSpan.textContent = parseFloat(ethers.formatEther(await provider.getBalance(user))).toFixed(4);
  
  // Show wallet info, hide connect button
  document.getElementById("connectBtn").style.display = "none";
  document.getElementById("walletInfo").style.display = "flex";
  
  contract.on("Payout", async (winner, amount) => {
    if (winner.toLowerCase() === user.toLowerCase()) {
      const ethAmount = parseFloat(ethers.formatEther(amount)).toFixed(4);
      showMessage(`🎉 YOU WON ${ethAmount} ETH!`, 'success');
      balanceSpan.textContent = parseFloat(ethers.formatEther(
        await provider.getBalance(user),
      )).toFixed(4);
    }
  });
};

// Quick amount buttons
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.onclick = () => {
    document.getElementById('amount').value = btn.dataset.amount;
  };
});

// Clear history button
const clearHistoryBtn = document.getElementById('clearHistory');
if (clearHistoryBtn) {
  clearHistoryBtn.onclick = () => {
    if (confirm('Clear all betting history?')) {
      bettingHistory = [];
      saveHistoryToStorage();
      renderHistory();
    }
  };
}
async function loadRound() {
  const { data } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);
  if (!data.length) return;
  const newRound = data[0];
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
  const timerProgress = document.getElementById('timerProgress');
  const totalTime = 30; // 30 seconds round duration
  
  timerInterval = setInterval(() => {
    const remaining = Math.floor(
      (new Date(currentRound.end_time) - new Date()) / 1000,
    );
    const seconds = remaining > 0 ? remaining : 0;
    timerSpan.textContent = seconds;
    
    // Update circular progress
    if (timerProgress) {
      const progress = (seconds / totalTime) * 283; // 283 is the circle circumference
      timerProgress.style.strokeDashoffset = 283 - progress;
      
      // Change color based on time remaining
      if (seconds <= 5) {
        timerProgress.style.stroke = '#EF4444'; // Red
      } else if (seconds <= 10) {
        timerProgress.style.stroke = '#F59E0B'; // Orange
      } else {
        timerProgress.style.stroke = '#10B981'; // Green
      }
    }
  }, 1000);
}
supabase
  .channel("rounds-live")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "rounds" },
    loadRound,
  )
  .subscribe();
document.querySelectorAll(".color-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".color-btn")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedColor = btn.dataset.color;
    
    // Enable bet button when color is selected
    const betBtn = document.getElementById("betBtn");
    betBtn.disabled = false;
  };
});

// Helper function to show messages
function showMessage(text, type = 'info') {
  msg.textContent = text;
  msg.className = `message ${type}`;
  setTimeout(() => {
    msg.textContent = '';
    msg.className = 'message';
  }, 5000);
}

document.getElementById("betBtn").onclick = async () => {
  if (!contract) {
    showMessage("Please connect your wallet first", 'error');
    return;
  }
  if (!currentRound || currentRound.status !== "OPEN") {
    showMessage("Betting is closed for this round", 'error');
    return;
  }
  if (!selectedColor) {
    showMessage("Please select a color", 'error');
    return;
  }
  
  const amount = document.getElementById("amount").value;
  if (!amount || parseFloat(amount) <= 0) {
    showMessage("Please enter a valid bet amount", 'error');
    return;
  }
  
  const betBtn = document.getElementById("betBtn");
  const btnContent = betBtn.querySelector('.btn-content');
  const btnLoader = betBtn.querySelector('.btn-loader');
  
  try {
    // Show loading state
    betBtn.disabled = true;
    btnContent.style.display = 'none';
    btnLoader.style.display = 'block';
    showMessage("⏳ Sending transaction...", 'info');
    
    const balanceBefore = await provider.getBalance(user);
    const tx = await contract.placeBet(
      currentRound.id,
      COLOR_MAP[selectedColor],
      { value: ethers.parseEther(amount) },
    );
    await tx.wait();
    const balanceAfter = await provider.getBalance(user);
    myBet = {
      roundId: currentRound.id,
      color: selectedColor,
      amount,
      balanceBefore: ethers.formatEther(balanceBefore),
      balanceAfter: ethers.formatEther(balanceAfter),
    };
    
    showMessage(`✅ Bet placed: ${amount} ETH on ${selectedColor}`, 'success');
    balanceSpan.textContent = parseFloat(ethers.formatEther(balanceAfter)).toFixed(4);
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  } finally {
    // Reset button state
    btnContent.style.display = 'flex';
    btnLoader.style.display = 'none';
    betBtn.disabled = false;
  }
};

async function handleResult(round) {
  const winningColor = round.result_color;
  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.classList.remove("selected");
    if (btn.dataset.color === winningColor) {
      btn.classList.add("selected");
    }
  });
  if (!myBet || myBet.roundId !== round.id) {
    msg.textContent = " Result: " + winningColor;
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const finalBalance = await provider.getBalance(user);
  const finalBalanceEth = ethers.formatEther(finalBalance);
  const won = myBet.color === winningColor;
  let winLossAmount;
  if (won) {
    const multiplier = winningColor === "VIOLET" ? 5 : 2;
    const winAmount = (parseFloat(myBet.amount) * multiplier).toFixed(4);
    winLossAmount = "+" + winAmount;
    msg.textContent = " YOU WON " + winAmount + " ETH!";
    msg.style.color = "#2ecc71";
  } else {
    winLossAmount = "-" + myBet.amount;
    msg.textContent =
      " YOU LOST " + myBet.amount + " ETH. Result: " + winningColor;
    msg.style.color = "#e74c3c";
  }
  
  // Show result message
  if (won) {
    showMessage(`🎉 YOU WON ${winLossAmount} ETH! Result: ${winningColor}`, 'success');
  } else {
    showMessage(`😞 YOU LOST ${myBet.amount} ETH. Result: ${winningColor}`, 'error');
  }
  
  bettingHistory.unshift({
    roundId: round.id,
    betAmount: myBet.amount,
    betColor: myBet.color,
    resultColor: winningColor,
    balanceBefore: myBet.balanceBefore,
    balanceAfter: finalBalanceEth,
    winLoss: winLossAmount,
    won: won,
    timestamp: new Date().toISOString(),
  });
  if (bettingHistory.length > 50) {
    bettingHistory = bettingHistory.slice(0, 50);
  }
  saveHistoryToStorage();
  renderHistory();
  balanceSpan.textContent = parseFloat(finalBalanceEth).toFixed(4);
  myBet = null;
}

function renderHistory() {
  const clearBtn = document.getElementById("clearHistory");
  if (!bettingHistory.length) {
    historyBody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: #888;">No betting history yet. Place your first bet!</td></tr>';
    document.getElementById("totalBets").textContent = "0";
    document.getElementById("totalWins").textContent = "0";
    if (clearBtn) clearBtn.style.display = "none";
    document.getElementById("totalLosses").textContent = "0";
    document.getElementById("netProfitLoss").textContent = "0 ETH";
    return;
  }
  
  // Show clear button when there's history
  if (clearBtn) clearBtn.style.display = "block";
  
  const totalBets = bettingHistory.length;
  const wins = bettingHistory.filter((h) => h.won).length;
  const losses = totalBets - wins;
  let netPL = 0;
  bettingHistory.forEach((h) => {
    const val = parseFloat(h.winLoss);
    netPL += val;
  });
  document.getElementById("totalBets").textContent = totalBets;
  document.getElementById("totalWins").textContent = wins;
  document.getElementById("totalLosses").textContent = losses;
  const netPLElement = document.getElementById("netProfitLoss");
  netPLElement.textContent =
    (netPL >= 0 ? "+" : "") + netPL.toFixed(4) + " ETH";
  netPLElement.style.color = netPL >= 0 ? "var(--color-success)" : "var(--color-danger)";
  historyBody.innerHTML = bettingHistory
    .map((h) => {
      const rowClass = h.won ? "win-row" : "loss-row";
      const amountClass = h.won ? "amount-win" : "amount-loss";
      return (
        '<tr class="' +
        rowClass +
        '"><td>#' +
        h.roundId +
        "</td><td>" +
        h.betAmount +
        ' ETH</td><td><span class="color-badge ' +
        h.betColor.toLowerCase() +
        '">' +
        h.betColor +
        '</span></td><td><span class="color-badge ' +
        h.resultColor.toLowerCase() +
        '">' +
        h.resultColor +
        "</span></td><td>" +
        parseFloat(h.balanceBefore).toFixed(4) +
        " ETH</td><td>" +
        parseFloat(h.balanceAfter).toFixed(4) +
        ' ETH</td><td class="' +
        amountClass +
        '">' +
        h.winLoss +
        " ETH</td></tr>"
      );
    })
    .join("");
}
async function loadHistory() {
  const { data } = await supabase
    .from("round_results_history")
    .select("*")
    .order("id", { ascending: false })
    .limit(20);
  resultsDiv.innerHTML = "";
  
  // Update history count
  const historyCount = document.getElementById('historyCount');
  if (historyCount) {
    historyCount.textContent = data.length;
  }
  
  data.forEach((r) => {
    const dot = document.createElement("div");
    dot.className = "result " + r.color.toLowerCase();
    dot.title = `Round ${r.round_id}: ${r.color}`;
    resultsDiv.appendChild(dot);
  });
}
supabase
  .channel("history-live")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "round_results_history" },
    loadHistory,
  )
  .subscribe();
loadRound();
loadHistory();
