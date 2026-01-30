import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// THESE WILL BE UPDATED AUTOMATICALLY BY START_ALL.bat
const CONTRACT_ADDRESS = "0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6";
const TOKEN_ADDRESS = "0xfDf4343D02330530cC4E3239C5f3F754a767fe7A";

const GAME_ABI = [
  "function placeBet(uint256 roundId, uint8 color, uint256 amount)",
  "event BetPlaced(uint256 indexed roundId, address indexed user, uint8 color, uint256 amount)",
  "event RoundResolved(uint256 indexed roundId, uint8 result)",
  "event Payout(address indexed user, uint256 amount)",
];

const TOKEN_ABI = [
  "function mint(address to, uint256 amount)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
];

const COLOR_MAP = { RED: 0, GREEN: 1, VIOLET: 2 };

// Supabase Setup
const supabase = createClient(
  "https://zskfvqfszulwuhshzuxa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U",
);

// UI Elements
const walletSpan = document.getElementById("wallet");
const balanceSpan = document.getElementById("balance");
const roundIdSpan = document.getElementById("roundId");
const roundStatusSpan = document.getElementById("roundStatus");
const timerSpan = document.getElementById("timer");
const msg = document.getElementById("msg");
const resultsDiv = document.getElementById("results");
const historyBody = document.getElementById("historyBody");

let provider, signer, gameContract, tokenContract, user;
let currentRound = null;
let selectedColor = null;
let myBet = null;
let timerInterval = null;
let bettingHistory = [];

// Init history and labels
loadHistoryFromStorage();
// Update currency labels to CGT
document.querySelectorAll(".currency-label, .input-suffix, #netProfitLoss, .stat-value").forEach(el => {
    if(el.textContent.includes("ETH")) el.textContent = el.textContent.replace("ETH", "CGT");
});

// --- CONNECT ---
document.getElementById("connectBtn").onclick = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    
    // Force add/update Sepolia with a high-performance RPC (Ankr)
    // This fixes the "RPC endpoint returned too many errors" issue
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia (Fast RPC)',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.ankr.com/eth_sepolia'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
        });
    } catch (e) {
        console.log("Network switch/add error:", e);
    }
    
    // Get signer from MetaMask (locks to the above RPC)
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    signer = await browserProvider.getSigner();
    user = await signer.getAddress();
    
    // Use the same robust RPC for our read-only provider
    provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
    
    // Init Contracts
    gameContract = new ethers.Contract(CONTRACT_ADDRESS, GAME_ABI, signer);
    tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider); // Read-only default

    walletSpan.textContent = user.slice(0, 6) + "..." + user.slice(-4);
    
    // Allow user to click the address to copy it (for Faucets)
    walletSpan.style.cursor = "pointer";
    walletSpan.title = "Click to Copy Address";
    walletSpan.onclick = () => {
        navigator.clipboard.writeText(user);
        showMessage("📋 Address Copied!", "success");
    };

    await updateBalance();
    
    // Show wallet info
    document.getElementById("connectBtn").style.display = "none";
    document.getElementById("walletInfo").style.display = "flex";

    // Inject Mint Button
    addMintButton();
    
    gameContract.on("Payout", async (winner, amount) => {
        if (winner.toLowerCase() === user.toLowerCase()) {
        const tokenAmount = parseFloat(ethers.formatEther(amount)).toFixed(2);
        showMessage(`?? YOU WON ${tokenAmount} CGT!`, 'success');
        await updateBalance();
        }
    });

    // Update labels dynamic
    document.querySelectorAll(".input-suffix").forEach(e => e.innerText = "CGT");
};

// --- MINT LOGIC ---
function addMintButton() {
    const container = document.querySelector('.wallet-info');
    if(container.querySelector('.mint-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'mint-btn';
    btn.innerHTML = '?? Mint 1000 CGT';
    btn.style.cssText = "margin-left: 15px; background: #8b5cf6; border: none; padding: 6px 12px; border-radius: 6px; color: white; cursor: pointer; font-weight: bold; font-size: 0.9rem;";
    
    btn.onclick = async () => {
        try {
            btn.disabled = true;
            btn.innerText = "Processing...";
            
            // Use signer for mint transaction (needs to be signed)
            const tokenWithSigner = tokenContract.connect(signer);
            const tx = await tokenWithSigner.mint(user, ethers.parseEther("1000"));
            showMessage("? Minting 1000 CGT...", 'info');
            await tx.wait();
            await updateBalance();
            showMessage("? Minted 1000 Tokens!", 'success');
        } catch (e) {
            console.error(e);
            showMessage("Mint failed: " + (e.reason || e.message), 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = "?? Mint 1000 CGT";
        }
    };
    container.appendChild(btn);
}

// --- BALANCE ---
async function updateBalance() {
    if(!tokenContract || !user) return;
    try {
        const balance = await tokenContract.balanceOf(user);
        balanceSpan.textContent = parseFloat(ethers.formatEther(balance)).toFixed(2);
    } catch(e) {
        console.error("Balance fetch error:", e);
    }
}

// --- BETTING ---
document.getElementById("betBtn").onclick = handleBet;

async function handleBet() {
    if (!gameContract || !tokenContract) {
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
    
    const amountVal = document.getElementById("amount").value;
    if (!amountVal || parseFloat(amountVal) <= 0) {
        showMessage("Please enter a valid amount", 'error');
        return;
    }

    const betBtn = document.getElementById("betBtn");
    const amountWei = ethers.parseEther(amountVal.toString());

    try {
        betBtn.disabled = true;
        showMessage("? Checking allowance...", 'info');
        
        // Check Allowance (use signer for reads that might need wallet context)
        const tokenWithSigner = tokenContract.connect(signer);
        const allowance = await tokenWithSigner.allowance(user, CONTRACT_ADDRESS);
        
        if (allowance < amountWei) {
            showMessage("✋ Requesting approval...", 'info');
            const approveTx = await tokenWithSigner.approve(CONTRACT_ADDRESS, ethers.MaxUint256); 
            await approveTx.wait();
            showMessage("? Approved! Placing bet...", 'info');
        }
        
        // 2. Place Bet
        showMessage("? Placing bet...", 'info');
        const balanceBefore = await tokenContract.balanceOf(user);
        
        // Updated call: No value sent, amount passed as arg
        const tx = await gameContract.placeBet(
            currentRound.id,
            COLOR_MAP[selectedColor],
            amountWei
        );
        await tx.wait();
        
        const balanceAfter = await tokenContract.balanceOf(user);
        
        myBet = {
            roundId: currentRound.id,
            color: selectedColor,
            amount: amountVal,
            balanceBefore: ethers.formatEther(balanceBefore),
            balanceAfter: ethers.formatEther(balanceAfter),
        };
        
        showMessage(`? Bet placed: ${amountVal} CGT on ${selectedColor}`, 'success');
        await updateBalance();

    } catch (error) {
        console.error(error);
        showMessage(`? Error: ${error.reason || error.message}`, 'error');
    } finally {
        betBtn.disabled = false;
    }
}

// --- STANDARD GAME LOGIC (Unchanged mostly) ---

// Quick amount buttons
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.onclick = () => {
    document.getElementById('amount').value = btn.dataset.amount;
  };
});

// Color Selection
document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.onclick = () => {
        document.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedColor = btn.dataset.color;
        document.getElementById("betBtn").disabled = false;
    };
});

async function loadRound() {
  const { data } = await supabase.from("rounds").select("*").order("id", { ascending: false }).limit(1);
  if (!data?.length) return;
  const newRound = data[0];
  
  if (currentRound && currentRound.status !== "RESOLVED" && newRound.status === "RESOLVED") {
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
  const totalTime = 30; // 30 seconds
  
  timerInterval = setInterval(() => {
    const remaining = Math.floor((new Date(currentRound.end_time) - new Date()) / 1000);
    const seconds = remaining > 0 ? remaining : 0;
    timerSpan.textContent = seconds;
    
    if (timerProgress) {
        const progress = (seconds / totalTime) * 283;
        timerProgress.style.strokeDashoffset = 283 - progress;
    }
  }, 1000);
}

supabase.channel("rounds-live").on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, loadRound).subscribe();

function showMessage(text, type = 'info') {
  msg.textContent = text;
  msg.className = `message ${type}`;
  setTimeout(() => { msg.textContent = ''; msg.className = 'message'; }, 5000);
}

async function handleResult(round) {
  const winningColor = round.result_color;
  if (!myBet || myBet.roundId !== round.id) return;
  
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const finalBalance = await tokenContract.balanceOf(user);
  const won = myBet.color === winningColor;
  let winLossAmount;

  if (won) {
    const multiplier = winningColor === "VIOLET" ? 5 : 2;
    const winAmount = (parseFloat(myBet.amount) * multiplier).toFixed(2);
    winLossAmount = "+" + winAmount;
    showMessage(`?? YOU WON ${winLossAmount} CGT!`, 'success');
  } else {
    winLossAmount = "-" + myBet.amount;
    showMessage(`?? YOU LOST ${myBet.amount} CGT.`, 'error');
  }
  
  bettingHistory.unshift({
    roundId: round.id,
    betAmount: myBet.amount,
    betColor: myBet.color,
    resultColor: winningColor,
    balanceBefore: myBet.balanceBefore,
    balanceAfter: ethers.formatEther(finalBalance),
    winLoss: winLossAmount,
    won: won,
    timestamp: new Date().toISOString(),
  });
  
  if (bettingHistory.length > 50) bettingHistory = bettingHistory.slice(0, 50);
  saveHistoryToStorage();
  renderHistory();
  await updateBalance();
  myBet = null;
}

function renderHistory() {
  const clearBtn = document.getElementById("clearHistory");
  if (!bettingHistory.length) {
    historyBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No history.</td></tr>';
    document.getElementById("totalBets").textContent = "0";
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }
  if (clearBtn) clearBtn.style.display = "block";
  document.getElementById("clearHistory").onclick = () => {
    if(confirm('Clear history?')) { bettingHistory = []; saveHistoryToStorage(); renderHistory(); }
  };

  historyBody.innerHTML = bettingHistory.map(h => 
    `<tr class="${h.won ? "win-row" : "loss-row"}">
        <td>#${h.roundId}</td>
        <td>${h.betAmount}</td>
        <td>${h.betColor}</td>
        <td>${h.resultColor}</td>
        <td>${parseFloat(h.balanceBefore).toFixed(2)}</td>
        <td>${parseFloat(h.balanceAfter).toFixed(2)}</td>
        <td>${h.winLoss}</td>
    </tr>`
  ).join("");
}

function loadHistoryFromStorage() {
  const saved = localStorage.getItem("bettingHistory");
  if (saved) { bettingHistory = JSON.parse(saved); renderHistory(); }
}
function saveHistoryToStorage() { localStorage.setItem("bettingHistory", JSON.stringify(bettingHistory)); }

async function loadResultHistory() {
  const { data } = await supabase.from("round_results_history").select("*").order("id", { ascending: false }).limit(12);
  resultsDiv.innerHTML = "";
  if(data) data.forEach(r => {
      const dot = document.createElement("div");
      dot.className = "result " + r.color.toLowerCase();
      resultsDiv.appendChild(dot);
  });
}
supabase.channel("history-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "round_results_history" }, loadResultHistory).subscribe();

loadRound();
loadResultHistory();
