const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 CHECKING RECENT ROUNDS");
  console.log("=========================\n");

  // Check rounds 755-760
  for (let roundId = 755; roundId <= 762; roundId++) {
    try {
      const round = await contract.rounds(roundId);
      const players = await contract.roundPlayers(roundId);
      
      console.log(`Round ${roundId}:`);
      console.log(`  Status: ${round.status === 0 ? 'OPEN' : 'RESOLVED'}`);
      console.log(`  Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
      console.log(`  Resolved: ${round.resolved}`);
      console.log(`  Players: ${players.length}`);
      
      if (players.length > 0) {
        for (let i = 0; i < players.length; i++) {
          const player = players[i];
          const bet = await contract.bets(roundId, player);
          const color = ['RED', 'GREEN', 'VIOLET'][bet.color];
          const won = bet.color === round.result;
          console.log(`    ${player.slice(0, 10)}... bet ${ethers.formatEther(bet.amount)} ETH on ${color} - ${won ? '✅ WON' : '❌ LOST'}`);
        }
      }
      console.log();
    } catch (error) {
      console.log(`  Round ${roundId} not found\n`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
