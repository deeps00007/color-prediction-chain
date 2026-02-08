const { ethers } = require('ethers');

const problematic = "0x397cc928de0044b7b6e051d03083BEA040E5E5F6";

try {
    console.log("Input:", problematic);
    const checksummed = ethers.getAddress(problematic.toLowerCase()); // Convert to lower first to be safe
    console.log("Valid Checksummed Address:", checksummed);
} catch (e) {
    console.error("Error:", e.message);
}
