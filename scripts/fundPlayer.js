const { ethers } = require("hardhat");

async function main() {
  const [account0, account1, account2] = await ethers.getSigners();
  
  console.log("\n💰 FUNDING PLAYER ACCOUNTS");
  console.log("==========================\n");
  
  // Account 2 (your playing account)
  const balanceBefore = await ethers.provider.getBalance(account1.address);
  console.log(`Account #1: ${account1.address}`);
  console.log(`Balance before: ${ethers.formatEther(balanceBefore)} ETH`);
  
  // Send 5000 ETH from account 0 to account 1
  console.log(`\nSending 5000 ETH from Account #0...`);
  const tx = await account0.sendTransaction({
    to: account1.address,
    value: ethers.parseEther("5000")
  });
  await tx.wait();
  
  const balanceAfter = await ethers.provider.getBalance(account1.address);
  console.log(`✅ Sent!`);
  console.log(`Balance after: ${ethers.formatEther(balanceAfter)} ETH\n`);
  
  console.log("Account #1 is now funded and ready to play!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
