const hre = require("hardhat");

async function main() {
  const [owner, account1] = await hre.ethers.getSigners();

  const BACKEND_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("Backend account:", BACKEND_ACCOUNT);
  
  // Check current balance
  const currentBalance = await hre.ethers.provider.getBalance(BACKEND_ACCOUNT);
  console.log("Current balance:", hre.ethers.formatEther(currentBalance), "ETH");

  // Send 100 ETH from account #1 to backend account for gas
  if (account1.address !== BACKEND_ACCOUNT) {
    const tx = await account1.sendTransaction({
      to: BACKEND_ACCOUNT,
      value: hre.ethers.parseEther("100.0")
    });

    await tx.wait();

    console.log("✅ Sent 100 ETH to backend account for gas");
  }
  
  // Check new balance
  const newBalance = await hre.ethers.provider.getBalance(BACKEND_ACCOUNT);
  console.log("💰 Backend account balance:", hre.ethers.formatEther(newBalance), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
