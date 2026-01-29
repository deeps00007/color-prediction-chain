const hre = require("hardhat");

async function main() {
  const ColorPrediction = await hre.ethers.getContractFactory("ColorPrediction");
  const contract = await ColorPrediction.deploy();

  await contract.waitForDeployment();

  console.log("✅ ColorPrediction deployed to:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
