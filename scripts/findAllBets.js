const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 FINDING ALL ROUNDS WITH BETS");
  console.log("================================\n");

  let foundRounds = [];

  // Check rounds 750-800
  for (let roundId = 750; roundId <= 800; roundId++) {
    try {
      const players = await contract.roundPlayers(roundId);
      if (players.length > 0) {
        foundRounds.push(roundId);
      }
    } catch (error) {
      // Round doesn't exist, continue
    }
  }

  if (foundRounds.length === 0) {
    console.log("❌ NO ROUNDS FOUND WITH BETS!\n");
    console.log("This means:");
    console.log("1. Your browser is using CACHED JavaScript with OLD contract address");
    console.log("2. MetaMask is sending transactions to a non-existent contract");
    console.log("3. Your transactions appear successful but go nowhere\n");
    console.log("SOLUTION:");
    console.log("========");
    console.log("1. Close browser completely");
    console.log("2. Clear browser cache");
    console.log("3. Open game-frontend/index.html again");
    console.log("4. Do HARD REFRESH: Ctrl + Shift + R");
    console.log("5. Reconnect MetaMask\n");
    return;
  }

  console.log(`Found ${foundRounds.length} rounds with bets:\n`);
  
  for (const roundId of foundRounds) {
    const round = await contract.rounds(roundId);
    const players = await contract.roundPlayers(roundId);
    
    console.log(`Round ${roundId}:`);
    console.log(`  Status: ${round.status === 0 ? 'OPEN' : 'RESOLVED'}`);
    console.log(`  Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
    console.log(`  Players: ${players.length}`);
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const bet = await contract.bets(roundId, player);
      const color = ['RED', 'GREEN', 'VIOLET'][bet.color];
      const won = bet.color === round.result;
      const payout = won ? (bet.color === 2n ? bet.amount * 5n : bet.amount * 2n) : 0n;
      
      console.log(`    ${player.slice(0, 10)}... bet ${ethers.formatEther(bet.amount)} on ${color} ${won ? '✅ WON ' + ethers.formatEther(payout) : '❌ LOST'}`);
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
