const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 DEEP DIVE: ROUND #779");
  console.log("========================\n");

  try {
    // Get round info
    const round = await contract.rounds(779);
    console.log(`Round Status: ${['OPEN', 'RESOLVED'][round.status]}`);
    console.log(`Resolved: ${round.resolved}`);
    console.log(`Result Color: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
    console.log();

    // Get all players
    const players = await contract.roundPlayers(779);
    console.log(`Total Players: ${players.length}\n`);

    if (players.length > 0) {
      console.log("ALL BETS:");
      console.log("=========");
      
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const bet = await contract.bets(779, player);
        const betColor = ['RED', 'GREEN', 'VIOLET'][bet.color];
        const won = bet.color === round.result;
        
        console.log(`\n${i + 1}. Player: ${player}`);
        console.log(`   Bet Amount: ${ethers.formatEther(bet.amount)} ETH`);
        console.log(`   Bet Color: ${betColor}`);
        console.log(`   Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
        
        if (won) {
          const expectedPayout = bet.color === 2n ? bet.amount * 5n : bet.amount * 2n;
          console.log(`   ✅ SHOULD HAVE WON: ${ethers.formatEther(expectedPayout)} ETH`);
          
          // Check if they were actually paid
          console.log(`   🔍 Checking if payout was sent...`);
        } else {
          console.log(`   ❌ Lost`);
        }
      }
    }

    // Check for Payout events
    console.log("\n\n📜 CHECKING PAYOUT EVENTS:");
    console.log("==========================");
    
    try {
      const filter = contract.filters.Payout();
      const events = await contract.queryFilter(filter, -1000, 'latest');
      
      const round779Payouts = events.filter(e => {
        // We need to check if this payout was for round 779
        // We can check the block and correlate with RoundResolved event
        return true; // For now show all
      });
      
      console.log(`Total Payout events found: ${events.length}\n`);
      
      if (events.length > 0) {
        console.log("Recent payouts:");
        events.slice(-10).forEach((event, i) => {
          console.log(`  ${i+1}. To: ${event.args.player}, Amount: ${ethers.formatEther(event.args.amount)} ETH (Block ${event.blockNumber})`);
        });
      } else {
        console.log("❌ NO PAYOUT EVENTS FOUND!");
        console.log("\nThis means the backend did NOT call resolveRound() on blockchain!");
      }
    } catch (error) {
      console.log("Error fetching events:", error.message);
    }

  } catch (error) {
    console.log("❌ Error checking round:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
