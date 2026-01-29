const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("\n📊 CHECKING ALL ROUNDS ON BLOCKCHAIN");
  console.log("=====================================\n");

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  let foundAnyBets = false;
  let roundsFound = [];

  // Check rounds 800-850
  for (let roundId = 800; roundId <= 850; roundId++) {
    try {
      const players = await contract.roundPlayers(roundId);
      if (players.length > 0) {
        foundAnyBets = true;
        roundsFound.push(roundId);
      }
    } catch (error) {
      // Round doesn't exist
    }
  }

  if (!foundAnyBets) {
    console.log("❌ NO ROUNDS WITH BETS FOUND ON BLOCKCHAIN!");
    console.log("\nThis means:");
    console.log("1. Your browser is NOT sending bets to the blockchain");
    console.log("2. MetaMask transactions are failing silently");
    console.log("3. The contract address in browser is wrong\n");
    
    console.log("DEBUGGING INFO:");
    console.log("===============");
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Frontend app.js has: (check the file)`);
    console.log();
    
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(`Contract balance: ${ethers.formatEther(contractBalance)} ETH`);
    console.log(`^ If this is only 10 ETH, no bets were ever received\n`);
    
    return;
  }

  console.log(`✅ Found ${roundsFound.length} rounds with bets:\n`);
  
  for (const roundId of roundsFound) {
    const round = await contract.rounds(roundId);
    const players = await contract.roundPlayers(roundId);
    
    console.log(`Round ${roundId}:`);
    console.log(`  Resolved: ${round.resolved ? 'YES' : 'NO'}`);
    console.log(`  Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
    console.log(`  Players: ${players.length}`);
    
    for (const player of players) {
      const bet = await contract.bets(roundId, player);
      console.log(`    ${player}: ${ethers.formatEther(bet.amount)} ETH on ${['RED','GREEN','VIOLET'][bet.color]}`);
    }
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
