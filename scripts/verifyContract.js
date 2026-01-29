const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  // Try to get code at address
  const code = await ethers.provider.getCode(contractAddress);
  console.log("\n📜 CONTRACT VERIFICATION");
  console.log("========================");
  console.log(`Address: ${contractAddress}`);
  console.log(`Has code: ${code !== '0x'}`);
  console.log(`Code length: ${code.length} bytes\n`);

  if (code === '0x') {
    console.log("❌ No contract at this address!");
    console.log("Need to redeploy.\n");
    return;
  }

  // Try both contract versions
  console.log("Testing ColorPrediction...");
  try {
    const ColorPrediction = await ethers.getContractFactory("ColorPrediction");
    const contract = ColorPrediction.attach(contractAddress);
    const owner = await contract.owner();
    console.log("✅ ColorPrediction works!");
    console.log(`Owner: ${owner}\n`);
  } catch (error) {
    console.log("❌ ColorPrediction failed:", error.message, "\n");
  }

  console.log("Testing ColorPredictionV2...");
  try {
    const ColorPredictionV2 = await ethers.getContractFactory("ColorPredictionV2");
    const contract = ColorPredictionV2.attach(contractAddress);
    const owner = await contract.owner();
    console.log("✅ ColorPredictionV2 works!");
    console.log(`Owner: ${owner}\n`);
  } catch (error) {
    console.log("❌ ColorPredictionV2 failed:", error.message, "\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
