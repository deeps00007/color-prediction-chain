const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 CHECKING ROUND #779");
  console.log("======================\n");

  try {
    const round = await contract.rounds(779);
    const players = await contract.roundPlayers(779);
    
    console.log(`Round Status: ${round.status === 0 ? 'OPEN' : 'RESOLVED'}`);
    console.log(`Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
    console.log(`Resolved: ${round.resolved}`);
    console.log(`Total Players: ${players.length}\n`);
    
    if (players.length > 0) {
      console.log("All Bets:");
      console.log("=========");
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const bet = await contract.bets(779, player);
        const color = ['RED', 'GREEN', 'VIOLET'][bet.color];
        const won = bet.color === round.result;
        const payout = won ? (bet.color === 2n ? bet.amount * 5n : bet.amount * 2n) : 0n;
        
        console.log(`\n${i+1}. Player: ${player}`);
        console.log(`   Bet: ${ethers.formatEther(bet.amount)} ETH on ${color}`);
        if (won) {
          console.log(`   ✅ WON - Should receive: ${ethers.formatEther(payout)} ETH`);
        } else {
          console.log(`   ❌ LOST`);
        }
      }
    } else {
      console.log("❌ No bets found in round 779!");
      console.log("\nThis means your bet was NOT recorded on the blockchain.");
      console.log("Possible reasons:");
      console.log("1. MetaMask transaction failed");
      console.log("2. Wrong network selected");
      console.log("3. Browser has cached old contract address");
    }
    
  } catch (error) {
    console.log("❌ Round 779 doesn't exist on blockchain!");
    console.log("Error:", error.message);
  }
  
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
