import { Product, Store } from '../models/index.mjs';
import blockchainController from '../controllers/blockchain.mjs';
import { fileURLToPath } from 'url';

async function mintPendingNFTs() {
  try {
    // Find all products that need NFT minting
    const pendingProducts = await Product.findAll({
      where: {
        blockchain_status: ['pending', 'failed']
      },
      include: [{
        model: Store,
        as: 'store',  // Specify the alias for the association
        attributes: ['wallet_address', 'name']
      }]
    });

    console.log(`Found ${pendingProducts.length} products pending NFT minting`);

    for (const product of pendingProducts) {
      try {
        if (!product.store?.wallet_address) {
          console.error(`No wallet address found for store of product ${product.id}`);
          continue;
        }

        // Create NFT metadata
        const tokenURI = JSON.stringify({
          name: product.name,
          description: product.description,
          image: product.images[0], // Use first image as NFT image
          attributes: product.attributes
        });

        // Attempt to mint NFT
        const result = await blockchainController.createProduct(
          product.store.wallet_address,
          product.name,
          product.store.name,
          tokenURI
        );

        if (!result?.tokenId) {
          throw new Error('No token ID returned from blockchain');
        }

        // Update product with NFT details
        await product.update({
          token_id: result.tokenId,
          blockchain_status: 'minted'
        });

        console.log(`Successfully minted NFT for product ${product.id}, token ID: ${result.tokenId}`);
      } catch (error) {
        console.error(`Failed to mint NFT for product ${product.id}:`, error);
        
        // Mark as failed but don't update token_id
        await product.update({
          blockchain_status: 'failed'
        });
      }
    }
  } catch (error) {
    console.error('Error in mintPendingNFTs job:', error);
  }
}

// Export for use in job scheduler
export default mintPendingNFTs;

// If run directly, execute once and exit
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mintPendingNFTs()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}