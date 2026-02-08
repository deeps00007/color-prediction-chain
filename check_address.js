const { ethers } = require('ethers');

const problematic = "0xbFE1BDdea85C3BD8759d4d85D4aCBEdDa59F55fD";

try {
    console.log("Input:", problematic);
    const checksummed = ethers.getAddress(problematic);
    console.log("Valid Checksummed Address:", checksummed);
} catch (e) {
    console.error("Error:", e.message);
}
