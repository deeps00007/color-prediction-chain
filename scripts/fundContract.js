const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();

  const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  
  // Send 10 ETH to the contract as house balance
  const tx = await owner.sendTransaction({
    to: CONTRACT_ADDRESS,
    value: hre.ethers.parseEther("10.0")
  });

  await tx.wait();

  console.log("✅ Sent 10 ETH to contract as house balance");
  
  // Check contract balance
  const balance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log("💰 Contract balance:", hre.ethers.formatEther(balance), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
