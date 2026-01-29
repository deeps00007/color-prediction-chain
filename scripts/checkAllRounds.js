const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 CHECKING ALL ROUNDS WITH BETS");
  console.log("=================================\n");

  let foundAny = false;

  // Check rounds 1-1000
  for (let roundId = 1; roundId <= 1000; roundId++) {
    try {
      const players = await contract.roundPlayers(roundId);
      
      if (players.length > 0) {
        foundAny = true;
        const round = await contract.rounds(roundId);
        
        console.log(`Round ${roundId}:`);
        console.log(`  Status: ${round.status === 0 ? 'OPEN' : 'RESOLVED'}`);
        console.log(`  Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
        console.log(`  Resolved: ${round.resolved}`);
        console.log(`  Players: ${players.length}`);
        
        for (let i = 0; i < players.length; i++) {
          const player = players[i];
          const bet = await contract.bets(roundId, player);
          const color = ['RED', 'GREEN', 'VIOLET'][bet.color];
          const won = bet.color === round.result;
          const payout = won ? (bet.color === 2n ? bet.amount * 5n : bet.amount * 2n) : 0n;
          console.log(`    Player: ${player}`);
          console.log(`    Bet: ${ethers.formatEther(bet.amount)} ETH on ${color}`);
          console.log(`    ${won ? '✅ WON ' + ethers.formatEther(payout) + ' ETH' : '❌ LOST'}`);
        }
        console.log();
      }
    } catch (error) {
      // Round doesn't exist
    }
  }

  if (!foundAny) {
    console.log("❌ No bets found in any round on this contract!");
    console.log("\nPossible reasons:");
    console.log("1. Your bet was on the OLD contract (before we redeployed)");
    console.log("2. Your bet transaction failed");
    console.log("3. MetaMask is connected to a different network\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
