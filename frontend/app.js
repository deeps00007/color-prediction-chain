const CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

// const CONTRACT_ADDRESS = "0xPASTE_DEPLOYED_CONTRACT_ADDRESS";

const abi = [
  "function placeBet(uint8) payable",
  "function currentRound() view returns(uint256)",
  "function roundStartTime() view returns(uint256)",
  "function totalWon(address) view returns(uint256)",
  "function totalLost(address) view returns(uint256)",
  "function lastResults(uint256) view returns(uint8)"
];

const MIN_BET = 0.001;
const MAX_BET = 0.05;

let provider;
let signer;
let contract;

async function init() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

  setupBetValidation();
  updateUI();
  setInterval(updateTimer, 1000);
}

function setupBetValidation() {
  const input = document.getElementById("betAmount");
  const buttons = document.querySelectorAll(".colors button");

  input.addEventListener("input", async () => {
    const value = Number(input.value);
    const houseBal = await provider.getBalance(CONTRACT_ADDRESS);
    const canPay = houseBal >= ethers.parseEther((value * 2).toString());

    const valid =
      value >= MIN_BET &&
      value <= MAX_BET &&
      canPay;

    buttons.forEach(btn => btn.disabled = !valid);

    if (!canPay && value > 0) {
      document.getElementById("status").innerText =
        "House balance too low for this bet";
    } else {
      document.getElementById("status").innerText =
        "Waiting for bet…";
    }
  });
}

async function updateUI() {
  const userAddr = await signer.getAddress();

  const balance = await provider.getBalance(userAddr);
  document.getElementById("balance").innerText =
    ethers.formatEther(balance);

  const houseBalance = await provider.getBalance(CONTRACT_ADDRESS);
  document.getElementById("houseBalance").innerText =
    ethers.formatEther(houseBalance);

  document.getElementById("round").innerText =
    await contract.currentRound();

  document.getElementById("won").innerText =
    ethers.formatEther(await contract.totalWon(userAddr));

  document.getElementById("lost").innerText =
    ethers.formatEther(await contract.totalLost(userAddr));

  updateHistory();
}

async function updateTimer() {
  const start = await contract.roundStartTime();
  const now = Math.floor(Date.now() / 1000);
  const remaining = 30 - (now - Number(start));
  document.getElementById("timer").innerText =
    Math.max(remaining, 0);
}

async function bet(color) {
  try {
    const amount = Number(document.getElementById("betAmount").value);

    if (amount < MIN_BET || amount > MAX_BET) {
      alert(`Bet must be between ${MIN_BET} and ${MAX_BET} ETH`);
      return;
    }

    document.getElementById("status").innerText =
      "Confirm transaction in MetaMask…";

    const tx = await contract.placeBet(color, {
      value: ethers.parseEther(amount.toString()),
      gasLimit: 300000
    });

    await tx.wait();

    document.getElementById("status").innerText =
      "Bet placed successfully!";
    updateUI();

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText =
      "Transaction failed";
  }
}

async function updateHistory() {
  const container = document.getElementById("history");
  container.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    try {
      const r = await contract.lastResults(i);
      const dot = document.createElement("span");

      dot.style.background =
        r == 0 ? "red" : r == 1 ? "green" : "violet";

      container.appendChild(dot);
    } catch {}
  }
}

init();
