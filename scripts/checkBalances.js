const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const backendAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // Get balances
  const contractBalance = await ethers.provider.getBalance(contractAddress);
  const backendBalance = await ethers.provider.getBalance(backendAddress);

  console.log("\n💰 BALANCE CHECK");
  console.log("================");
  console.log(`Contract: ${ethers.formatEther(contractBalance)} ETH`);
  console.log(`Backend:  ${ethers.formatEther(backendBalance)} ETH`);

  // Get contract and check last few events
  const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
  const contract = ColorPrediction.attach(contractAddress);

  try {
    // Get recent Payout events
    const filter = contract.filters.Payout();
    const events = await contract.queryFilter(filter, -100); // Last 100 blocks
    
    console.log(`\n🎁 Recent Payouts: ${events.length} found`);
    if (events.length > 0) {
      console.log("Last 5 payouts:");
      events.slice(-5).forEach((event, i) => {
        console.log(`  ${i+1}. Winner: ${event.args.player}, Amount: ${ethers.formatEther(event.args.amount)} ETH`);
      });
    }
  } catch (error) {
    console.log("Could not fetch events:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
