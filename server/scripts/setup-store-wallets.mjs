import { Store, Product } from '../src/models/index.mjs';
import { ethers } from 'ethers';
import sequelize from '../src/config/database.mjs';
import { fileURLToPath } from 'url';

async function setupStoreWallets() {
  try {
    // Get all stores that have products but no wallet address
    const stores = await Store.findAll({
      include: [{
        model: Product,
        as: 'products',
        required: true // Only get stores that have products
      }],
      where: {
        wallet_address: null
      }
    });

    console.log(`Found ${stores.length} stores needing wallet setup`);

    for (const store of stores) {
      // Create a new wallet for each store
      const wallet = ethers.Wallet.createRandom();
      
      await store.update({
        wallet_address: wallet.address
      });

      console.log(`Created wallet for store ${store.name}:`);
      console.log(`Address: ${wallet.address}`);
      console.log(`Private Key: ${wallet.privateKey}`);
      console.log('------------------------');
      
      // Important: In a production environment, you would want to:
      // 1. Securely store the private keys
      // 2. Fund these wallets with ETH for gas fees
      // 3. Set up proper key management
    }

    console.log('Wallet setup complete');
  } catch (error) {
    console.error('Error setting up store wallets:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupStoreWallets()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}