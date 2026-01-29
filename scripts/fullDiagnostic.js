const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔧 COMPLETE SYSTEM DIAGNOSTIC");
  console.log("==============================\n");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const backendPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  
  // 1. Check blockchain connection
  console.log("1️⃣ Blockchain Connection:");
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`   ✅ Connected - Block #${blockNumber}\n`);
  } catch (error) {
    console.log(`   ❌ NOT connected: ${error.message}\n`);
    return;
  }

  // 2. Check if contract exists
  console.log("2️⃣ Contract Status:");
  const code = await ethers.provider.getCode(contractAddress);
  if (code === '0x') {
    console.log(`   ❌ NO CONTRACT at ${contractAddress}\n`);
    return;
  }
  console.log(`   ✅ Contract exists\n`);

  // 3. Get contract instance
  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  // 4. Check contract owner
  console.log("3️⃣ Contract Owner:");
  const owner = await contract.owner();
  const backendWallet = new ethers.Wallet(backendPrivateKey);
  console.log(`   Contract Owner: ${owner}`);
  console.log(`   Backend Account: ${backendWallet.address}`);
  console.log(`   Match: ${owner === backendWallet.address ? '✅' : '❌'}\n`);

  // 5. Check balances
  console.log("4️⃣ Account Balances:");
  const contractBalance = await ethers.provider.getBalance(contractAddress);
  const backendBalance = await ethers.provider.getBalance(backendWallet.address);
  console.log(`   Contract: ${ethers.formatEther(contractBalance)} ETH`);
  console.log(`   Backend: ${ethers.formatEther(backendBalance)} ETH\n`);

  // 6. Test manual resolution
  console.log("5️⃣ Testing Manual Resolution:");
  console.log("   Creating test round...");
  
  const [, player] = await ethers.getSigners();
  const testRoundId = 9999;
  
  try {
    // Place a test bet
    const betAmount = ethers.parseEther("1");
    console.log(`   Placing test bet: 1 ETH on GREEN by ${player.address.slice(0, 10)}...`);
    
    const betTx = await contract.connect(player).placeBet(testRoundId, 1, { value: betAmount });
    await betTx.wait();
    console.log(`   ✅ Bet placed!`);

    // Check bet was recorded
    const bet = await contract.bets(testRoundId, player.address);
    console.log(`   ✅ Bet recorded: ${ethers.formatEther(bet.amount)} ETH on ${['RED','GREEN','VIOLET'][bet.color]}`);

    // Try to resolve as backend
    console.log(`   Resolving round as backend...`);
    const backendSigner = new ethers.Wallet(backendPrivateKey, ethers.provider);
    const contractAsBackend = contract.connect(backendSigner);
    
    const balanceBefore = await ethers.provider.getBalance(player.address);
    console.log(`   Player balance before: ${ethers.formatEther(balanceBefore)} ETH`);
    
    const resolveTx = await contractAsBackend.resolveRound(testRoundId, 1); // GREEN wins
    const receipt = await resolveTx.wait();
    console.log(`   ✅ Resolution transaction confirmed!`);
    
    const balanceAfter = await ethers.provider.getBalance(player.address);
    console.log(`   Player balance after: ${ethers.formatEther(balanceAfter)} ETH`);
    
    const payout = balanceAfter - balanceBefore;
    console.log(`   💰 Payout: ${ethers.formatEther(payout)} ETH`);
    
    if (payout > 0) {
      console.log(`   ✅✅✅ PAYOUTS WORK! The contract is functioning correctly!\n`);
      console.log(`   🔍 The problem is with the BACKEND not calling resolveRound()`);
    } else {
      console.log(`   ❌ No payout received!\n`);
    }

    // Check events
    const payoutEvents = receipt.logs.filter(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'Payout';
      } catch { return false; }
    });
    
    console.log(`   Payout events emitted: ${payoutEvents.length}`);
    
  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}\n`);
    if (error.data) {
      console.log(`   Error data: ${error.data}`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
