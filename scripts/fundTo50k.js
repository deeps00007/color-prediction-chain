const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  
  console.log("\n💰 FUNDING ACCOUNT #1 TO EXACTLY 50,000 ETH");
  console.log("============================================\n");

  const account1 = signers[1];
  const targetBalance = ethers.parseEther("50000");
  
  const currentBalance = await ethers.provider.getBalance(account1.address);
  const currentBalanceEth = ethers.formatEther(currentBalance);
  
  console.log(`Account #1: ${account1.address}`);
  console.log(`Current balance: ${currentBalanceEth} ETH`);
  console.log(`Target balance: 50,000 ETH\n`);
  
  if (currentBalance >= targetBalance) {
    console.log("✅ Account already has 50,000+ ETH!");
    return;
  }
  
  const needed = targetBalance - currentBalance;
  console.log(`Need to add: ${ethers.formatEther(needed)} ETH\n`);
  
  // Try to gather funds from other accounts
  let totalSent = 0n;
  
  for (let i = 0; i < signers.length; i++) {
    if (i === 1) continue; // Skip Account #1 itself
    
    const sender = signers[i];
    const senderBalance = await ethers.provider.getBalance(sender.address);
    const availableToSend = senderBalance - ethers.parseEther("100"); // Keep 100 for gas
    
    if (availableToSend > 0n) {
      const amountToSend = availableToSend > (needed - totalSent) ? (needed - totalSent) : availableToSend;
      
      console.log(`Account #${i}: Sending ${ethers.formatEther(amountToSend)} ETH...`);
      const tx = await sender.sendTransaction({
        to: account1.address,
        value: amountToSend
      });
      await tx.wait();
      
      totalSent += amountToSend;
      
      if (totalSent >= needed) {
        break;
      }
    }
  }
  
  const finalBalance = await ethers.provider.getBalance(account1.address);
  console.log(`\n✅ Final balance: ${ethers.formatEther(finalBalance)} ETH`);
  
  if (finalBalance >= targetBalance) {
    console.log("🎉 Account #1 now has 50,000 ETH!");
  } else {
    console.log(`⚠️  Could only add ${ethers.formatEther(totalSent)} ETH (not enough funds available)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
