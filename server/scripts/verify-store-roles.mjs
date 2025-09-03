import { ethers } from 'ethers';
import { Store } from '../src/models/index.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import Sequelize from 'sequelize';
const { Op } = Sequelize;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function verifyStoreRoles() {
    try {
        console.log('Starting store role verification...');

        // Initialize blockchain connection
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL || 'http://192.168.0.4:8545');
        const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

        // Load SupplyChain contract
        const supplyChainArtifact = JSON.parse(
            await fs.readFile(join(__dirname, '../src/contracts/SupplyChain.json'), 'utf8')
        );
        const supplyChain = new ethers.Contract(
            process.env.SUPPLY_CHAIN_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            supplyChainArtifact.abi,
            deployerWallet
        );

        // Find all active stores
        const stores = await Store.findAll({
            where: {
                deleted_at: null,
                wallet_address: {
                    [Op.ne]: null
                }
            }
        });

        console.log(`Found ${stores.length} stores to verify`);

        // Check and grant roles for each store
        for (const store of stores) {
            try {
                console.log(`Verifying store ${store.id} (${store.name}) at address ${store.wallet_address}...`);

                // Check if store has seller role
                const hasSellerRole = await supplyChain.isSeller(store.wallet_address);
                console.log(`Has seller role: ${hasSellerRole}`);

                if (!hasSellerRole) {
                    console.log('Granting seller role...');
                    const tx = await supplyChain.grantSellerRole(store.wallet_address);
                    await tx.wait();
                    console.log('Seller role granted successfully');

                    // Verify role was granted
                    const hasRoleNow = await supplyChain.isSeller(store.wallet_address);
                    console.log(`Role verification after grant: ${hasRoleNow}`);
                } else {
                    console.log('Store already has seller role');
                }

                console.log(`Successfully processed store ${store.id}`);
            } catch (error) {
                console.error(`Failed to process store ${store.id}:`, error);
                // Continue with next store
                continue;
            }
        }

        console.log('Store role verification completed');
    } catch (error) {
        console.error('Failed to verify store roles:', error);
        process.exit(1);
    }
}

// Run the script
verifyStoreRoles()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });