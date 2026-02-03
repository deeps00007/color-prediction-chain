const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Game Token
  const GameToken = await hre.ethers.getContractFactory("GameToken");
  const token = await GameToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ GameToken deployed to:", tokenAddress);

  // 2. Deploy ColorPrediction (Passing Token Address)
  const ColorPrediction = await hre.ethers.getContractFactory("ColorPrediction");
  const prediction = await ColorPrediction.deploy(tokenAddress);
  await prediction.waitForDeployment();
  const predictionAddress = await prediction.getAddress();
  console.log("✅ ColorPrediction deployed to:", predictionAddress);

  // 3. Setup Initial Balances
  const ONE_THOUSAND_TOKENS = hre.ethers.parseEther("1000");
  const HOUSE_POOL_TOKENS = hre.ethers.parseEther("50000");

  // Mint to House (The Game Contract)
  // Our custom token has a public mint function for ease of use
  await (await token.mint(predictionAddress, HOUSE_POOL_TOKENS)).wait();
  console.log("💰 Minted 50,000 CGT to House Pool (Game Contract)");

  // Mint to Deployer
  await (await token.mint(deployer.address, ONE_THOUSAND_TOKENS)).wait();
  console.log("💰 Minted 1,000 CGT to Deployer");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
