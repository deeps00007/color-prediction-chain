const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 SCANNING FOR ANY ROUNDS WITH BETS");
  console.log("=====================================\n");

  const contractBalance = await ethers.provider.getBalance(contractAddress);
  console.log(`Contract has ${ethers.formatEther(contractBalance)} ETH\n`);
  console.log("If > 10 ETH, bets were placed. Searching...\n");

  // Check a wide range
  for (let roundId = 1; roundId <= 1000; roundId++) {
    try {
      const players = await contract.roundPlayers(roundId);
      if (players.length > 0) {
        const round = await contract.rounds(roundId);
        console.log(`✅ FOUND Round ${roundId}:`);
        console.log(`   Players: ${players.length}`);
        console.log(`   Resolved: ${round.resolved}`);
        console.log(`   Result: ${['RED','GREEN','VIOLET'][round.result]}`);
        
        for (const player of players) {
          const bet = await contract.bets(roundId, player);
          console.log(`     ${player}: ${ethers.formatEther(bet.amount)} ETH on ${['RED','GREEN','VIOLET'][bet.color]}`);
        }
        console.log();
      }
    } catch (error) {
      // Round doesn't exist, continue
    }
  }
  
  console.log("Scan complete.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
