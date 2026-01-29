const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  // Use account #1 as test player
  const [, player] = await ethers.getSigners();
  
  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  console.log("\n🎲 TEST BET");
  console.log("===========");
  console.log(`Player: ${player.address}`);
  console.log(`Contract: ${contractAddress}\n`);

  // Place bet on round 763 (current round in Supabase)
  const betAmount = ethers.parseEther("0.01"); // 0.01 ETH bet
  const color = 0; // RED

  console.log(`Placing bet: 0.01 ETH on RED for round 763...`);
  
  const tx = await contract.connect(player).placeBet(763, color, { value: betAmount });
  await tx.wait();
  
  console.log("✅ Bet placed!");
  console.log(`Transaction: ${tx.hash}\n`);

  // Check if bet was recorded
  const bet = await contract.bets(763, player.address);
  console.log("Bet recorded on blockchain:");
  console.log(`  Amount: ${ethers.formatEther(bet.amount)} ETH`);
  console.log(`  Color: ${['RED', 'GREEN', 'VIOLET'][bet.color]}`);
  console.log(`  Exists: ${bet.exists}\n`);

  console.log("⏳ Waiting for round to resolve (30 seconds)...");
  console.log("The backend will automatically resolve and pay winners.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
