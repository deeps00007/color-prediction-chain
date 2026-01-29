const hre = require("hardhat");

async function main() {
  const [owner, user1, user2] = await hre.ethers.getSigners();

  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  const ColorPrediction = await hre.ethers.getContractFactory("ColorPrediction");
  const contract = await ColorPrediction.attach(CONTRACT_ADDRESS);

  console.log("Contract attached");

  // ===== USER 1 BET =====
  await contract.connect(user1).placeBet(
    1, // roundId
    0, // RED
    { value: hre.ethers.parseEther("0.01") }
  );

  console.log("🎲 User1 placed bet on RED");

  // ===== USER 2 BET =====
  await contract.connect(user2).placeBet(
    1, // roundId
    2, // VIOLET
    { value: hre.ethers.parseEther("0.01") }
  );

  console.log("🎲 User2 placed bet on VIOLET");

  // ===== RESOLVE ROUND =====
  await contract.connect(owner).resolveRound(
    1, // roundId
    2  // VIOLET wins
  );

  console.log("🏁 Round resolved: VIOLET");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
