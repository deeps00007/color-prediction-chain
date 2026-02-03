const { ethers } = require("ethers");
require("dotenv").config({ path: "./game-backend/.env" }); // Load env if needed, or use hardcoded key for testnet

// Configuration
const CONTRACT_ADDRESS = "0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6";
const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const ROUND_ID = 936;
const RESULT_COLOR = 0; // 0 = RED, 1 = GREEN, 2 = VIOLET

const GAME_ABI = [
    "function resolveRound(uint256 roundId, uint8 result)"
];

async function resolve() {
    // Note: We need the PRIVATE_KEY to sign the tx.
    // Assuming the user has it in their environment or I can ask for it.
    // For this environment, I'll attempt to use the hardhat signer or check .env file if available.
    // BUT since I am running "node", I need the key.

    // I will try to read from the game-backend .env content if I can. 
    // Wait, I can't read files easily in a script without fs, but I can assume process.env is populated if I require dotenv.

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ PRIVATE_KEY Not found in env. Please ensure .env is loaded.");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, GAME_ABI, wallet);

    console.log(`Resolving Round #${ROUND_ID} with Result: ${RESULT_COLOR} (RED)...`);

    try {
        const tx = await contract.resolveRound(ROUND_ID, RESULT_COLOR);
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Round Resolved Successfully!");
    } catch (error) {
        console.error("Error resolving round:", error);
    }
}

resolve();
