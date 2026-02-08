const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const PLINKO_ADDRESS = fs.readFileSync('plinko_address.txt', 'utf8').trim();
    // We need to know the User's address. Since I can't easily get the browser user's address, 
    // I will check the deployer's address as a proxy (if they are using the deployer account in browser, which is common in dev).
    // But likely they are using a different MetaMask account.

    // Let's just check the House Balance for now.
    const Token = await hre.ethers.getContractAt("GameToken", "0xfDf4343D02330530cC4E3239C5f3F754a767fe7A");

    const houseBalance = await Token.balanceOf(PLINKO_ADDRESS);
    console.log(`🏠 Plinko Contract (${PLINKO_ADDRESS}) Balance: ${hre.ethers.formatEther(houseBalance)} CGT`);

    if (houseBalance == 0n) {
        console.error("❌ CRITICAL: Plinko contract has 0 tokens! It cannot pay out winners.");
    } else {
        console.log("✅ House is funded.");
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
