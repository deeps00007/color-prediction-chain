const { ethers } = require("ethers");

// Configuration
const CONTRACT_ADDRESS = "0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6";
const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const ROUND_ID = 936;

const GAME_ABI = [
    "function rounds(uint256) view returns (uint8 status, uint8 result, bool resolved)"
];

async function checkRound() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, GAME_ABI, provider);

    console.log(`Checking Round #${ROUND_ID} on contract ${CONTRACT_ADDRESS}...`);

    try {
        const round = await contract.rounds(ROUND_ID);

        console.log("\n--- Round Data ---");
        // Status: 0=OPEN, 1=RESOLVED
        console.log("Status:", round[0].toString() == "0" ? "OPEN" : "RESOLVED");
        console.log("Result Color:", ["RED", "GREEN", "VIOLET"][round[1]]);
        console.log("Resolved Flag:", round[2]);

        if (!round[2]) {
            console.log("\n❌ Round is NOT resolved on-chain yet.");
        } else {
            console.log("\n✅ Round IS resolved on-chain.");
        }

    } catch (error) {
        console.error("Error fetching round:", error);
    }
}

checkRound();
