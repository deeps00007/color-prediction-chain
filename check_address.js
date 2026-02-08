const fs = require('fs');
const { ethers } = require('ethers');

async function main() {
    try {
        const raw = fs.readFileSync('plinko_address.txt', 'utf8');
        console.log("Raw content:", JSON.stringify(raw));

        const clean = raw.trim();
        console.log("Cleaned content:", clean);

        try {
            const checksummed = ethers.getAddress(clean);
            console.log("Valid Checksummed Address:", checksummed);
        } catch (e) {
            console.error("Invalid Address:", e.message);
        }
    } catch (e) {
        console.error("File error:", e);
    }
}

main();
