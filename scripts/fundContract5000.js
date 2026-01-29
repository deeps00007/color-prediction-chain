const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const richGuy = signers[1]; // Use Account #1 who has 50k ETH
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("💰 Sending 5000 ETH to contract from:", richGuy.address);
  
  const tx = await richGuy.sendTransaction({
    to: contractAddress,
    value: hre.ethers.parseEther("5000")
  });
  
  await tx.wait();
  
  const balance = await hre.ethers.provider.getBalance(contractAddress);
  console.log("✅ Contract balance is now:", hre.ethers.formatEther(balance), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
