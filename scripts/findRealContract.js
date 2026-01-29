const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 FINDING THE REAL CONTRACT ADDRESS");
  console.log("======================================\n");

  // Check all common Hardhat deployment addresses
  const possibleAddresses = [
    "0x5FbDB2315678afecb367f032d93F642f64180aa3", // First deployment
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Second deployment
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Third deployment
    "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Fourth deployment
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", // Fifth deployment
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", // Sixth deployment
    "0x0165878A594ca255338adfa4d48449f69242Eb8F", // Seventh deployment
    "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", // Eighth deployment
    "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6", // Ninth deployment
    "0x8A791620dd6260079BF849Dc5567aD3 Fb71B549", // Tenth deployment
    "0x610178dA211FEF7D417bC0e6FeD39F05609AD788", // Eleventh deployment
    "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e", // Twelfth deployment
    "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0", // 13th
    "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82", // 14th
    "0x9A676e781A523b5d0C0e43731313A708CB607508", // 15th
    "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1", // 16th
    "0x4A679253410272dd5232B3Ff7cF5dbB88f295319", // Old one we used
  ];

  for (const address of possibleAddresses) {
    const code = await ethers.provider.getCode(address);
    if (code !== '0x') {
      const balance = await ethers.provider.getBalance(address);
      const balanceEth = ethers.formatEther(balance);
      
      console.log(`✅ Found contract at: ${address}`);
      console.log(`   Balance: ${balanceEth} ETH`);
      
      if (parseFloat(balanceEth) > 100) {
        console.log(`   🎯 THIS IS THE ONE! (has ${balanceEth} ETH from bets)\n`);
        
        // Try to check rounds on this contract
        const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
        const contract = ColorPrediction.attach(address);
        
        try {
          const owner = await contract.owner();
          console.log(`   Owner: ${owner}`);
          
          // Check for round 822
          try {
            const players = await contract.roundPlayers(822);
            console.log(`   Round 822 has ${players.length} bets!`);
            
            for (const player of players) {
              const bet = await contract.bets(822, player);
              console.log(`     Player: ${player}`);
              console.log(`     Bet: ${ethers.formatEther(bet.amount)} ETH`);
            }
          } catch (e) {
            console.log(`   Round 822: Not found`);
          }
          
        } catch (error) {
          console.log(`   Error reading contract: ${error.message}`);
        }
      }
      console.log();
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
