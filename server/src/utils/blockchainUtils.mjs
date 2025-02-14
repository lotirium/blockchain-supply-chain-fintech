import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

export function generateWalletCredentials() {
    const wallet = ethers.Wallet.createRandom();
    return {
        address: wallet.address,
        privateKey: wallet.privateKey.slice(2) // Remove '0x' prefix for DB storage
    };
}

export async function setupStoreWallet(storeWalletAddress, privateKey) {
    const envVarName = `STORE_${storeWalletAddress.slice(2).toUpperCase()}_KEY`;
    
    // Set in current process
    process.env[envVarName] = privateKey;
    
    // Append to .env file
    try {
        const envFile = path.join(process.cwd(), '.env');
        const newEntry = `\n${envVarName}=${privateKey}`;
        
        await fs.appendFile(envFile, newEntry);
        console.log('Added new store wallet to .env file:', envVarName);
    } catch (error) {
        console.error('Failed to update .env file:', error);
        throw new Error('Failed to save store wallet credentials');
    }
}