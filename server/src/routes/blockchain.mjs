import express from 'express';
import { body, param } from 'express-validator';
import { Op } from 'sequelize';
import validateRequest from '../middleware/validateRequest.mjs';
import auth, { requireSeller, requireAdmin } from '../middleware/auth.mjs';
import blockchainController from '../controllers/blockchain.mjs';
import { Product, Store } from '../models/index.mjs';

const router = express.Router();

// Network Status
router.get('/status', async (req, res) => {
  try {
    // Get basic network status first
    const status = await blockchainController.getNetworkStatus();
    
    if (!status.isConnected) {
      return res.json({
        isConnected: false,
        name: 'Not Connected',
        chainId: 'N/A',
        blockNumber: 'N/A',
        gasPrice: 'N/A'
      });
    }

    // If connected, try to get contracts status
    try {
      const [productNFT, supplyChain] = await Promise.all([
        blockchainController.getProductNFT().catch(() => null),
        blockchainController.getSupplyChain().catch(() => null)
      ]);

      return res.json({
        ...status,
        contracts: {
          productNFT: productNFT ? 'Connected' : 'Not Connected',
          supplyChain: supplyChain ? 'Connected' : 'Not Connected'
        }
      });
    } catch (contractError) {
      // Still return network status even if contracts fail
      console.warn('Failed to get contracts status:', contractError);
      return res.json({
        ...status,
        contracts: {
          productNFT: 'Not Connected',
          supplyChain: 'Not Connected'
        }
      });
    }
  } catch (error) {
    console.error('Failed to get network status:', error);
    return res.status(500).json({
      isConnected: false,
      name: 'Error',
      chainId: 'N/A',
      blockNumber: 'N/A',
      gasPrice: 'N/A',
      error: error.message
    });
  }
});

// Role Management Routes
router.post('/roles/manufacturer', requireAdmin, async (req, res) => {
  try {
    const result = await blockchainController.grantManufacturerRole(req.body.address);
    res.json(result);
  } catch (error) {
    console.error('Failed to grant manufacturer role:', error);
    res.status(500).json({
      error: 'Failed to grant manufacturer role',
      details: error.message
    });
  }
});

router.post('/roles/distributor', requireAdmin, async (req, res) => {
  try {
    const result = await blockchainController.grantDistributorRole(req.body.address);
    res.json(result);
  } catch (error) {
    console.error('Failed to grant distributor role:', error);
    res.status(500).json({
      error: 'Failed to grant distributor role',
      details: error.message
    });
  }
});

router.post('/roles/retailer', requireAdmin, async (req, res) => {
  try {
    const result = await blockchainController.grantRetailerRole(req.body.address);
    res.json(result);
  } catch (error) {
    console.error('Failed to grant retailer role:', error);
    res.status(500).json({
      error: 'Failed to grant retailer role',
      details: error.message
    });
  }
});

router.get('/roles/:address', async (req, res) => {
  try {
    const roles = await blockchainController.checkRoles(req.params.address);
    res.json(roles);
  } catch (error) {
    console.error('Failed to check roles:', error);
    res.status(500).json({
      error: 'Failed to check roles',
      details: error.message
    });
  }
});

// Contract Management Routes
router.post('/contract/pause', requireAdmin, async (req, res) => {
  try {
    const result = await blockchainController.pauseContract();
    res.json(result);
  } catch (error) {
    console.error('Failed to pause contract:', error);
    res.status(500).json({
      error: 'Failed to pause contract',
      details: error.message
    });
  }
});

router.post('/contract/unpause', requireAdmin, async (req, res) => {
  try {
    const result = await blockchainController.unpauseContract();
    res.json(result);
  } catch (error) {
    console.error('Failed to unpause contract:', error);
    res.status(500).json({
      error: 'Failed to unpause contract',
      details: error.message
    });
  }
});

// Event Stream
router.get('/events', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await blockchainController.subscribeToEvents(sendEvent);
    
    req.on('close', () => {
      blockchainController.unsubscribeFromEvents(sendEvent);
    });
  } catch (error) {
    console.error('Failed to setup event stream:', error);
    res.status(500).end();
  }
});


// Validation middleware
const createProductValidation = [
  body('name').notEmpty().trim().withMessage('Product name is required'),
  body('manufacturer').notEmpty().trim().withMessage('Manufacturer is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('attributes')
    .optional()
    .isArray()
    .withMessage('Attributes must be an array'),
  validateRequest,
];

const updateProductStatusValidation = [
  param('tokenId').notEmpty().withMessage('Token ID is required'),
  body('status').notEmpty().withMessage('Status is required'),
  validateRequest,
];

const updateShipmentStatusValidation = [
  param('tokenId').notEmpty().withMessage('Token ID is required'),
  body('stage').notEmpty().withMessage('Stage is required'),
  body('location').optional().isString().withMessage('Location must be a string'),
  validateRequest
];

// Product Management Routes
router.get('/products', async (req, res) => {
  try {
    // Only get products that have been minted as NFTs
    const products = await Product.findAll({
      where: {
        token_id: {
          [Op.not]: null  // Only get products where token_id is not null
        },
        blockchain_status: 'minted'  // Only get successfully minted products
      },
      include: [{
        model: Store,
        as: 'store',  // Add the alias that's defined in the association
        attributes: ['name', 'wallet_address']
      }],
      attributes: ['id', 'name', 'description', 'manufacturer', 'token_id', 'status', 'blockchain_status', 'images', 'attributes']
    });

    res.json(products);
  } catch (error) {
    console.error('Failed to get NFT products:', error);
    res.status(500).json({
      error: 'Failed to get NFT products',
      details: error.message
    });
  }
});

router.post('/products', requireSeller, createProductValidation, async (req, res) => {
  try {
    const { name, manufacturer, price, description, attributes } = req.body;
    const result = await blockchainController.createProduct(
      req.user.id,
      name,
      manufacturer,
      price,
      description,
      attributes
    );
    res.status(201).json(result);
  } catch (error) {
    console.error('Product creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
});

router.get('/products/:tokenId', async (req, res) => {
  try {
    const product = await blockchainController.getProduct(req.params.tokenId);
    res.json(product);
  } catch (error) {
    console.error('Failed to get product:', error);
    res.status(500).json({ 
      error: 'Failed to get product details',
      details: error.message 
    });
  }
});

router.put('/products/:tokenId/status', requireSeller, updateProductStatusValidation, async (req, res) => {
  try {
    const txHash = await blockchainController.updateProductStatus(
      req.user.id,
      req.params.tokenId,
      req.body.status
    );
    res.json({ transaction: txHash });
  } catch (error) {
    console.error('Failed to update product status:', error);
    res.status(500).json({ 
      error: 'Failed to update product status',
      details: error.message 
    });
  }
});

// Image Management Routes
router.post('/products/upload-images', requireSeller, async (req, res) => {
  try {
    const imageUrls = await blockchainController.handleImageUpload(req);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Image upload failed:', error);
    res.status(500).json({
      error: 'Failed to upload images',
      details: error.message
    });
  }
});

// NFT Management Routes
router.put('/nft/:tokenId/metadata', requireSeller, async (req, res) => {
  try {
    const result = await blockchainController.updateNFTMetadata(
      req.params.tokenId,
      {
        ...req.body.metadata,
        userId: req.user.id
      }
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to update NFT metadata:', error);
    res.status(500).json({
      error: 'Failed to update NFT metadata',
      details: error.message
    });
  }
});

router.get('/nft/:tokenId/status', async (req, res) => {
  try {
    const status = await blockchainController.getNFTStatus(req.params.tokenId);
    res.json(status);
  } catch (error) {
    console.error('Failed to get NFT status:', error);
    res.status(500).json({
      error: 'Failed to get NFT status',
      details: error.message
    });
  }
});

// Supply Chain Routes
router.get('/products/:tokenId/shipments', async (req, res) => {
  try {
    const history = await blockchainController.getShipmentHistory(req.params.tokenId);
    if (!history) {
      return res.json([]);
    }
    res.json(history);
  } catch (error) {
    console.error('Failed to get shipment history:', error);
    res.status(500).json({
      error: 'Failed to get shipment history',
      details: error.message
    });
  }
});

router.put('/products/:tokenId/shipment', requireSeller, updateShipmentStatusValidation, async (req, res) => {
  try {
    const txHash = await blockchainController.updateShipmentStatus(
      req.user.id,
      req.params.tokenId,
      req.body.stage,
      req.body.location
    );
    res.json({ transaction: txHash });
  } catch (error) {
    console.error('Failed to update shipment status:', error);
    res.status(500).json({ 
      error: 'Failed to update shipment status',
      details: error.message 
    });
  }
});

// Hologram Routes
router.post('/products/:tokenId/hologram', requireSeller, async (req, res) => {
  try {
    const hologramData = await blockchainController.generateHologram(
      req.params.tokenId,
      req.body.productData
    );
    res.json(hologramData);
  } catch (error) {
    console.error('Failed to generate hologram:', error);
    res.status(500).json({
      error: 'Failed to generate hologram',
      details: error.message
    });
  }
});

router.get('/hologram/:hologramId/verify', async (req, res) => {
  try {
    const result = await blockchainController.verifyHologram(req.params.hologramId);
    res.json(result);
  } catch (error) {
    console.error('Failed to verify hologram:', error);
    res.status(500).json({
      error: 'Failed to verify hologram',
      details: error.message
    });
  }
});

export default router;