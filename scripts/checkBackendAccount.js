const { ethers } = require("hardhat");

async function main() {
  const backendPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const backendAddress = new ethers.Wallet(backendPrivateKey).address;
  
  console.log("\n🔑 BACKEND ACCOUNT INFO");
  console.log("=======================");
  console.log(`Address: ${backendAddress}`);
  console.log(`Private Key: ${backendPrivateKey.slice(0, 20)}...`);
  
  const balance = await ethers.provider.getBalance(backendAddress);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  
  console.log("\n⚠️  IF YOUR METAMASK ADDRESS MATCHES THIS,");
  console.log("YOU ARE USING THE BACKEND ACCOUNT!");
  console.log("\nThis means:");
  console.log("- When you place bets, it costs gas");
  console.log("- When backend resolves rounds, it uses YOUR account");
  console.log("- You can't receive payouts (backend can't pay itself!)");
  console.log("\n✅ SOLUTION: Use a DIFFERENT MetaMask account for playing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
