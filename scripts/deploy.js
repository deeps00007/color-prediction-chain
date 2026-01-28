async function main() {
  const Game = await ethers.getContractFactory("ColorPredictionV2");
  const game = await Game.deploy();

  await game.waitForDeployment();
  console.log("ColorPredictionV2 deployed to:", await game.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
