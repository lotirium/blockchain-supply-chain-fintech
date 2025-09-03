import { ethers } from 'ethers';
import { Store } from '../src/models/index.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function updateStoreWallets() {
    try {
        console.log('Starting store wallet update...');

        // Initialize blockchain connection
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL || 'http://192.168.0.4:8545');

        // Load SupplyChain contract
        const supplyChainArtifact = JSON.parse(
            await fs.readFile(join(__dirname, '../src/contracts/SupplyChain.json'), 'utf8')
        );
        const supplyChain = new ethers.Contract(
            process.env.SUPPLY_CHAIN_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            supplyChainArtifact.abi,
            deployerWallet
        );

        // Find stores without private keys
        const stores = await Store.findAll({
            where: {
                private_key: null,
                deleted_at: null
            }
        });

        console.log(`Found ${stores.length} stores without private keys`);

        // Update each store
        for (const store of stores) {
            try {
                console.log(`Updating store ${store.id} (${store.name})...`);

                // Generate new wallet
                const newWallet = ethers.Wallet.createRandom();
                console.log(`Generated new wallet: ${newWallet.address}`);

                // Fund the wallet with retry
                const fundReceipt = await (async () => {
                    const FALLBACK_DEPLOYER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
                    const getSigner = () => new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || FALLBACK_DEPLOYER_PK, provider);
                    for (let i = 0; i < 3; i++) {
                        try {
                            const tx = await getSigner().sendTransaction({
                                to: newWallet.address,
                                value: ethers.parseEther('100.0')
                            });
                            return await tx.wait();
                        } catch (e) {
                            const msg = (e?.message || '').toLowerCase();
                            if ((e?.code === 'NONCE_EXPIRED' || msg.includes('nonce too low')) && i < 2) {
                                await new Promise(r => setTimeout(r, 300));
                                continue;
                            }
                            throw e;
                        }
                    }
                })();
                console.log('Funded wallet with 100 ETH');

                // Grant seller role with retry
                await (async () => {
                    const FALLBACK_DEPLOYER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
                    const getSigner = () => new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || FALLBACK_DEPLOYER_PK, provider);
                    for (let i = 0; i < 3; i++) {
                        try {
                            const tx = await supplyChain.connect(getSigner()).grantSellerRole(newWallet.address);
                            await tx.wait();
                            return;
                        } catch (e) {
                            const msg = (e?.message || '').toLowerCase();
                            if ((e?.code === 'NONCE_EXPIRED' || msg.includes('nonce too low')) && i < 2) {
                                await new Promise(r => setTimeout(r, 300));
                                continue;
                            }
                            throw e;
                        }
                    }
                })();
                console.log('Granted seller role');

                // Update store record
                await store.update({
                    wallet_address: newWallet.address,
                    private_key: newWallet.privateKey.slice(2) // Remove '0x' prefix
                });
                console.log('Updated store record');

                console.log(`Successfully updated store ${store.id}`);
            } catch (error) {
                console.error(`Failed to update store ${store.id}:`, error);
                // Continue with next store
                continue;
            }
        }

        console.log('Store wallet update completed');
    } catch (error) {
        console.error('Failed to update store wallets:', error);
        process.exit(1);
    }
}

// Run the script
updateStoreWallets()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });