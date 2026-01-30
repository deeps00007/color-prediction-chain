const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const richGuy = signers[0]; // Use default owner
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log(" Sending 5000 ETH to contract from:", richGuy.address);
  
  try {
    const tx = await richGuy.sendTransaction({
      to: contractAddress,
      value: hre.ethers.parseEther("5000")
    });
    
    await tx.wait();
    console.log(" Sent 5000 ETH to contract");
  } catch (err) {
    console.log(" Could not send 5000 ETH (maybe insufficient funds). Trying 100 ETH...");
    const tx = await richGuy.sendTransaction({
      to: contractAddress,
      value: hre.ethers.parseEther("100")
    });
    await tx.wait();
  }
  
  const balance = await hre.ethers.provider.getBalance(contractAddress);
  console.log(" Contract balance is now:", hre.ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
