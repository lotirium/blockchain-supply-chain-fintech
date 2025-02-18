const fs = require('fs');
const path = require('path');

// Source and destination paths
const artifactsDir = path.join(__dirname, '../artifacts/contracts');
const serverContractsDir = path.join(__dirname, '../../server/src/contracts');

// Ensure target directory exists
if (!fs.existsSync(serverContractsDir)) {
    fs.mkdirSync(serverContractsDir, { recursive: true });
}

// Copy contract artifacts
const contracts = ['LogiCoin', 'SupplyChain', 'ProductNFT'];

contracts.forEach(contract => {
    const sourceFile = path.join(artifactsDir, `${contract}.sol/${contract}.json`);
    const destFile = path.join(serverContractsDir, `${contract}.json`);
    
    try {
        if (!fs.existsSync(sourceFile)) {
            console.error(`Source file not found: ${sourceFile}`);
            console.log('Please run "npx hardhat compile" first');
            process.exit(1);
        }
        
        fs.copyFileSync(sourceFile, destFile);
        console.log(`Copied ${contract}.json to server contracts directory`);
    } catch (error) {
        console.error(`Failed to copy ${contract}.json:`, error);
        process.exit(1);
    }
});

console.log('Successfully copied all contract artifacts to server directory');