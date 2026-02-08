const fs = require('fs');

const configFile = 'game-frontend/src/config.js';
const cleanAddress = '0x397cc928de0044b7b6e051d03083bea040e5e5f6'; // Lowercase is safer

try {
    let content = fs.readFileSync(configFile, 'utf8');

    // Regex to find and replace the PLINKO_ADDRESS line, protecting against any invisible chars
    const regex = /export const PLINKO_ADDRESS = ".*";/;

    if (regex.test(content)) {
        const newContent = content.replace(regex, `export const PLINKO_ADDRESS = "${cleanAddress}";`);
        fs.writeFileSync(configFile, newContent, 'utf8');
        console.log(`Successfully updated ${configFile} with clean address: ${cleanAddress}`);
    } else {
        console.error("Could not find PLINKO_ADDRESS pattern in config.js");
    }
} catch (e) {
    console.error("Error updating config:", e);
}
