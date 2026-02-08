const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying Plinko with account:", deployer.address);

    // Address of existing GameToken on Sepolia
    // We need to fetch this from config or previous deployment log.
    // From previous context: TOKEN_ADDRESS = "0xfDf4343D02330530cC4E3239C5f3F754a767fe7A"
    const TOKEN_ADDRESS = "0xfDf4343D02330530cC4E3239C5f3F754a767fe7A";

    const Plinko = await hre.ethers.getContractFactory("Plinko");
    const plinko = await Plinko.deploy(TOKEN_ADDRESS);

    await plinko.waitForDeployment();
    const plinkoAddress = await plinko.getAddress();

    console.log("✅ Plinko deployed at:", plinkoAddress);
    const fs = require('fs');
    fs.writeFileSync('plinko_address.txt', plinkoAddress);

    // Fund the Plinko contract with some tokens so it can pay out
    // The deployer should have tokens from previous mints.
    const Token = await hre.ethers.getContractAt("GameToken", TOKEN_ADDRESS);
    const fundAmount = hre.ethers.parseEther("10000"); // Fund with 10k tokens

    console.log("Funding Plinko contract...");
    const tx = await Token.mint(plinkoAddress, fundAmount);
    await tx.wait();

    console.log("💰 Plinko funded with 10,000 CGT");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
