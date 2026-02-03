const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const addresses = JSON.parse(fs.readFileSync("deployed_addresses.json", "utf8"));
    const { tokenAddress, predictionAddress, deployerAddress } = addresses;

    console.log("🔍 Checking Contracts...");
    console.log("Token:", tokenAddress);
    console.log("Game:", predictionAddress);

    const token = await hre.ethers.getContractAt("GameToken", tokenAddress);
    const game = await hre.ethers.getContractAt("ColorPrediction", predictionAddress);

    // 1. Check House Balance
    const houseBal = await token.balanceOf(predictionAddress);
    console.log("💰 House Balance:", hre.ethers.formatEther(houseBal), "CGT");

    if (houseBal == 0) {
        console.error("❌ HOUSE HAS NO FUNDS! PAYOUTS WILL FAIL.");
    } else {
        console.log("✅ House is funded.");
    }

    // 2. Check Minting
    console.log("🧪 Attempting to mint 1 CGT to deployer...");
    try {
        const tx = await token.mint(deployerAddress, hre.ethers.parseEther("1"));
        console.log("Tx sent:", tx.hash);
        await tx.wait();
        console.log("✅ Mint successful! Public minting works.");
    } catch (e) {
        console.error("❌ MINT FAILED:", e.message);
    }

    console.log("Done.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
