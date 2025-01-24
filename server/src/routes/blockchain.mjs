import express from 'express';
import { body, param } from 'express-validator';
import validateRequest from '../middleware/validateRequest.mjs';
import auth, { requireSeller } from '../middleware/auth.mjs';
import blockchainController from '../controllers/blockchain.mjs';

const router = express.Router();

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
  validateRequest,
];

// Product Management Routes
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