import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const ABI = [
  "function resolveRound(uint256 roundId, uint8 result) external",
  "function rounds(uint256) view returns (uint8 status, uint8 result, bool resolved)"
];

async function main() {
  console.log("\n🧪 TESTING BACKEND CAN RESOLVE ROUND 822");
  console.log("=========================================\n");

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);

  console.log(`Backend address: ${wallet.address}`);
  console.log(`Contract address: ${process.env.CONTRACT_ADDRESS}`);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`Backend balance: ${ethers.formatEther(balance)} ETH\n`);

  // Check round 822 before
  try {
    const round = await contract.rounds(822);
    console.log(`Round 822 before:`);
    console.log(`  Status: ${round.status}`);
    console.log(`  Resolved: ${round.resolved}\n`);
    
    if (round.resolved) {
      console.log("✅ Already resolved!");
      return;
    }
    
    // Try to resolve it
    console.log("Attempting to resolve round 822 as RED...");
    const tx = await contract.resolveRound(822, 0); // 0 = RED
    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}!`);
    
    // Check again
    const roundAfter = await contract.rounds(822);
    console.log(`\nRound 822 after:`);
    console.log(`  Status: ${roundAfter.status}`);
    console.log(`  Resolved: ${roundAfter.resolved}`);
    console.log(`  Result: ${['RED','GREEN','VIOLET'][roundAfter.result]}\n`);
    
    if (roundAfter.resolved) {
      console.log("✅✅✅ BACKEND CAN RESOLVE ROUNDS!");
      console.log("The backend code is working!");
      console.log("The problem is the backend is NOT being called for your actual game rounds!\n");
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    if (error.message.includes("Already resolved")) {
      console.log("Round was already resolved");
    }
  }
}

main().catch(console.error);
