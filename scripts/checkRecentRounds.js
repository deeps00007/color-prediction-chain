const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("\n🔍 CHECKING LAST 10 ROUNDS");
  console.log("==========================\n");

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  // Check rounds 880-895 (recent ones)
  for (let roundId = 880; roundId <= 895; roundId++) {
    try {
      const round = await contract.rounds(roundId);
      const players = await contract.roundPlayers(roundId);
      
      if (players.length > 0) {
        console.log(`Round ${roundId}:`);
        console.log(`  Resolved on blockchain: ${round.resolved ? '✅ YES' : '❌ NO'}`);
        console.log(`  Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
        console.log(`  Players: ${players.length}`);
        
        for (const player of players) {
          const bet = await contract.bets(roundId, player);
          const won = bet.color === round.result;
          console.log(`    ${player.slice(0, 10)}... ${won ? '✅ WON' : '❌ LOST'}`);
        }
        console.log();
      }
    } catch (error) {
      // Round doesn't exist
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
