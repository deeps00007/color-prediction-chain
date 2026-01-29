const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 CHECKING ROUND #800");
  console.log("======================\n");

  try {
    const round = await contract.rounds(800);
    const players = await contract.roundPlayers(800);
    
    console.log(`Round Status: ${round.status === 0 ? 'OPEN ⚠️' : 'RESOLVED ✅'}`);
    console.log(`Resolved: ${round.resolved}`);
    console.log(`Result Color: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
    console.log(`Total Players: ${players.length}\n`);
    
    if (players.length > 0) {
      console.log("BETS IN THIS ROUND:");
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const bet = await contract.bets(800, player);
        const color = ['RED', 'GREEN', 'VIOLET'][bet.color];
        const won = bet.color === round.result;
        const payout = won ? (bet.color === 2n ? bet.amount * 5n : bet.amount * 2n) : 0n;
        
        console.log(`\nPlayer: ${player}`);
        console.log(`Bet: ${ethers.formatEther(bet.amount)} ETH on ${color}`);
        console.log(`Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
        
        if (won) {
          console.log(`Status: ✅ WINNER - Should get ${ethers.formatEther(payout)} ETH`);
          
          // Check current balance
          const currentBalance = await ethers.provider.getBalance(player);
          console.log(`Current balance: ${ethers.formatEther(currentBalance)} ETH`);
        } else {
          console.log(`Status: ❌ LOST`);
        }
      }
    } else {
      console.log("❌ NO BETS FOUND!");
    }
    
    // Check if round was actually resolved
    if (!round.resolved) {
      console.log("\n⚠️  PROBLEM: Round is NOT resolved on blockchain!");
      console.log("The backend did NOT call resolveRound()");
      console.log("This is why you didn't get paid!");
    }
    
  } catch (error) {
    console.log("❌ Round 800 doesn't exist:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
