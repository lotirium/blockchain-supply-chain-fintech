import { ethers } from 'ethers';
import { Store } from '../src/models/index.mjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { join } from 'path';
import Sequelize from 'sequelize';
const { Op } = Sequelize;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function fundStoreWallets() {
    try {
        console.log('Starting store wallet funding...');

        // Initialize blockchain connection
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL || 'http://192.168.0.4:8545');
        const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

        // Find all active stores with wallet addresses
        const stores = await Store.findAll({
            where: {
                deleted_at: null,
                wallet_address: {
                    [Op.ne]: null
                }
            }
        });

        console.log(`Found ${stores.length} stores to fund`);

        // Fund each store
        for (const store of stores) {
            try {
                console.log(`Funding store ${store.id} (${store.name}) at address ${store.wallet_address}...`);

                // Check current balance
                const balance = await provider.getBalance(store.wallet_address);
                console.log(`Current balance: ${ethers.formatEther(balance)} ETH`);

                if (balance < ethers.parseEther('10.0')) {
                    // Get current nonce
                    const nonce = await provider.getTransactionCount(deployerWallet.address);

                    // Fund the wallet
                    const fundingTx = await deployerWallet.sendTransaction({
                        to: store.wallet_address,
                        value: ethers.parseEther('100.0'),
                        nonce: nonce
                    });
                    await fundingTx.wait();
                    console.log(`Funded wallet with 100 ETH. Transaction hash: ${fundingTx.hash}`);

                    // Verify new balance
                    const newBalance = await provider.getBalance(store.wallet_address);
                    console.log(`New balance: ${ethers.formatEther(newBalance)} ETH`);
                } else {
                    console.log('Store wallet has sufficient funds, skipping...');
                }

                console.log(`Successfully processed store ${store.id}`);
            } catch (error) {
                console.error(`Failed to fund store ${store.id}:`, error);
                // Continue with next store
                continue;
            }
        }

        console.log('Store wallet funding completed');
    } catch (error) {
        console.error('Failed to fund store wallets:', error);
        process.exit(1);
    }
}

// Run the script
fundStoreWallets()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });