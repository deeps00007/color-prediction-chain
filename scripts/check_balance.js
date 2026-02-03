const { ethers } = require("ethers");

const CONTRACT_ADDRESS = "0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6";
const TOKEN_ADDRESS = "0xfDf4343D02330530cC4E3239C5f3F754a767fe7A";
const RPC_URL = "https://ethereum-sepolia.publicnode.com";

const TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)"
];

async function checkBalance() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);

    console.log(`Checking balance of House (Contract: ${CONTRACT_ADDRESS})...`);

    try {
        const balanceWei = await tokenContract.balanceOf(CONTRACT_ADDRESS);
        const balance = ethers.formatEther(balanceWei);
        console.log(`\n==========================================`);
        console.log(`🏠 HOUSE BALANCE: ${balance} CGT`);
        console.log(`==========================================\n`);
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

checkBalance();
