const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🔍 CHECKING ROUND #822 (YOUR ACTUAL BET)");
  console.log("=========================================\n");

  try {
    const round = await contract.rounds(822);
    console.log(`Round Status: ${round.status === 0 ? 'OPEN ❌' : 'RESOLVED ✅'}`);
    console.log(`Resolved on blockchain: ${round.resolved}`);
    console.log(`Result Color: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
    
    const players = await contract.roundPlayers(822);
    console.log(`Total Players: ${players.length}\n`);
    
    if (players.length > 0) {
      console.log("BETS:");
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const bet = await contract.bets(822, player);
        const color = ['RED', 'GREEN', 'VIOLET'][bet.color];
        const won = bet.color === round.result;
        const expectedPayout = won ? (bet.color === 2n ? bet.amount * 5n : bet.amount * 2n) : 0n;
        
        console.log(`Player: ${player}`);
        console.log(`Bet: ${ethers.formatEther(bet.amount)} ETH on ${color}`);
        console.log(`Result: ${['RED', 'GREEN', 'VIOLET'][round.result]}`);
        
        if (won) {
          console.log(`✅ WINNER - Should have received ${ethers.formatEther(expectedPayout)} ETH`);
          console.log(`Round resolved: ${round.resolved ? 'YES' : 'NO - BACKEND DID NOT CALL resolveRound()!'}`);
        } else {
          console.log(`❌ LOST`);
        }
        console.log();
      }
    } else {
      console.log("❌ NO BETS FOUND ON BLOCKCHAIN!");
      console.log("Your bet exists in Supabase but NOT on blockchain!");
      console.log("This means the frontend is NOT calling contract.placeBet()!\n");
    }
    
    if (!round.resolved) {
      console.log("\n🚨 CRITICAL ISSUE:");
      console.log("Round #822 is NOT RESOLVED on blockchain!");
      console.log("Backend did NOT call contract.resolveRound()");
      console.log("This is why you got no payout!\n");
    }
    
  } catch (error) {
    console.log("❌ Round 822 doesn't exist on blockchain!");
    console.log(`Error: ${error.message}\n`);
    console.log("This means your bet was NEVER sent to the blockchain!");
    console.log("The frontend is calling Supabase but NOT the smart contract!\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
