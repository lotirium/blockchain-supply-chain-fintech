import { ethers } from 'ethers';
import { Store } from '../src/models/index.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import Sequelize from 'sequelize';
const { Op } = Sequelize;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Helper: create a fresh signer each time to avoid stale nonce
const FALLBACK_DEPLOYER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const getSigner = (provider) => new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || FALLBACK_DEPLOYER_PK, provider);

async function sendWithRetry(label, makeTx, maxRetries = 3, delayMs = 300) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tx = await makeTx();
      return await tx.wait();
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if ((e?.code === 'NONCE_EXPIRED' || msg.includes('nonce too low')) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }
}

// Helpers for quieter, robust runs
const QUIET = process.env.FUND_VERBOSE !== 'true';
const debug = (...args) => { if (!QUIET) console.log(...args); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const MIN_BALANCE_ETH = '10.0';
const FUND_AMOUNT_ETH = '100.0';

async function hasEnoughFunds(provider, address) {
  const bal = await provider.getBalance(address);
  return { enough: bal >= ethers.parseEther(MIN_BALANCE_ETH), bal };
}

async function hasSellerRoleCall(supplyChain, address) {
  try { return await supplyChain.isSeller(address); } catch { return false; }
}

async function ensureStoreReady(provider, supplyChain, store) {
  // Up to 4 attempts to satisfy both funding and role
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { enough, bal } = await hasEnoughFunds(provider, store.wallet_address);
    debug(`[attempt ${attempt}] balance ${ethers.formatEther(bal)} ETH; enough=${enough}`);
    if (!enough) {
      await sendWithRetry('fund', async () => {
        const signer = getSigner(provider);
        return signer.sendTransaction({ to: store.wallet_address, value: ethers.parseEther(FUND_AMOUNT_ETH) });
      }, 5, 500);
      await sleep(200);
    }

    const hasRole = await hasSellerRoleCall(supplyChain, store.wallet_address);
    debug(`[attempt ${attempt}] hasSellerRole=${hasRole}`);
    if (!hasRole) {
      await sendWithRetry('grant', async () => {
        const signer = getSigner(provider);
        return supplyChain.connect(signer).grantSellerRole(store.wallet_address);
      }, 5, 500);
      await sleep(200);
    }

    // Verify both conditions
    const finalBal = await provider.getBalance(store.wallet_address);
    const finalEnough = finalBal >= ethers.parseEther(MIN_BALANCE_ETH);
    const finalRole = await hasSellerRoleCall(supplyChain, store.wallet_address);
    if (finalEnough && finalRole) {
      return { funded: !enough, roleGranted: !hasRole, balanceEth: ethers.formatEther(finalBal) };
    }
  }
  const finalBal = await provider.getBalance(store.wallet_address);
  const finalRole = await hasSellerRoleCall(supplyChain, store.wallet_address);
  return { funded: false, roleGranted: false, balanceEth: ethers.formatEther(finalBal), failed: true, finalRole };
}


async function fundStoreWallets() {
    try {
        console.log('Starting store wallet funding...');

        // Initialize blockchain connection
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL || 'http://192.168.0.4:8545');

        // Load SupplyChain contract for role management
        const { promises: fs } = await import('fs');
        const supplyChainArtifact = JSON.parse(
            await fs.readFile(join(__dirname, '../src/contracts/SupplyChain.json'), 'utf8')
        );
        const supplyChain = new ethers.Contract(
            process.env.SUPPLY_CHAIN_ADDRESS,
            supplyChainArtifact.abi,
            provider
        );

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
                    // Fund the wallet (let ethers handle nonce)
                    const receipt = await sendWithRetry('fund', async () => {
                        const signer = getSigner(provider);
                        return signer.sendTransaction({
                            to: store.wallet_address,
                            value: ethers.parseEther('100.0')
                        });
                    });
                    console.log(`Funded wallet with 100 ETH. Tx status: ${receipt.status}`);

                    // Verify new balance
                    const newBalance = await provider.getBalance(store.wallet_address);
                    console.log(`New balance: ${ethers.formatEther(newBalance)} ETH`);
                } else {
                    console.log('Store wallet has sufficient funds, skipping...');
                }

                // Check and grant seller role
                const hasSellerRole = await supplyChain.isSeller(store.wallet_address);
                console.log(`Has seller role: ${hasSellerRole}`);

                if (!hasSellerRole) {
                    console.log('Granting seller role...');
                    await sendWithRetry('grant', async () => {
                        const signer = getSigner(provider);
                        const connected = supplyChain.connect(signer);
                        return connected.grantSellerRole(store.wallet_address);
                    });
                    console.log('Seller role granted successfully');
                } else {
                    console.log('Store already has seller role');
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