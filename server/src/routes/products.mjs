import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Store, Product } from '../models/index.mjs';
import { requireSeller } from '../middleware/auth.mjs';
import { generateProductHologram } from '../services/imageService.mjs';

const router = express.Router();
import blockchainController from '../controllers/blockchain.mjs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/products');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer with improved settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file
    files: 5, // Maximum 5 files
    fieldSize: 30 * 1024 * 1024 // 30MB field size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxFileSize = 25 * 1024 * 1024; // 25MB

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
      return;
    }

    // Check file size before processing
    if (file.size && file.size > maxFileSize) {
      cb(new Error(`File too large. Maximum size is ${Math.floor(maxFileSize / (1024 * 1024))}MB.`));
      return;
    }

    cb(null, true);
  }
}).array('images', 5);

// Enhanced error handling middleware for multer with timeout
const handleUpload = (req, res, next) => {
  console.log('Starting file upload handling...');
  console.log('Request headers:', req.headers);
  
  // Set a timeout for the entire upload process
  const uploadTimeout = setTimeout(() => {
    console.error('Upload timeout reached');
    return res.status(408).json({
      error: 'Upload timeout. Please try again with smaller files or better connection.'
    });
  }, 30000); // 30 second timeout

  upload(req, res, (err) => {
    console.log('Multer upload callback reached');
    clearTimeout(uploadTimeout);

    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large. Maximum size is 25MB per file.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Too many files. Maximum is 5 images.'
        });
      }
      if (err.code === 'LIMIT_FIELD_VALUE') {
        return res.status(400).json({
          error: 'Field value too large. Please reduce the data size.'
        });
      }
      return res.status(400).json({
        error: `Upload error: ${err.message}`
      });
    }
    
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        error: err.message || 'Error uploading files'
      });
    }

    // Validate total upload size
    if (req.files) {
      const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 100 * 1024 * 1024; // 100MB total limit
      if (totalSize > maxTotalSize) {
        return res.status(400).json({
          error: 'Total upload size exceeds 100MB. Please reduce image sizes.'
        });
      }
    }

    next();
  });
};

// Middleware to validate store status
const validateStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ 
      where: { 
        user_id: req.user.id 
      }
    });

    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found. Please ensure you are registered as a seller.' 
      });
    }

    // Store status check is now optional since stores are active by default
    // but we'll keep a check for suspended stores
    if (store.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Your store is currently suspended. Please contact support for assistance.' 
      });
    }

    // Attach store to request for use in route handlers
    req.store = store;
    next();
  } catch (error) {
    console.error('Store validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create product with improved error handling and timeout
router.post('/', requireSeller, validateStore, handleUpload, async (req, res) => {
  console.log('POST /api/products - Request received');
  console.log('Request body fields:', Object.keys(req.body));
  console.log('Request files:', req.files?.length || 0, 'files received');
  console.log('Starting product creation...');
  const timeout = setTimeout(() => {
    console.error('Product creation timeout');
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout while creating product' });
    }
  }, 25000); // 25 second timeout

  try {
    console.log('Validating request body...');
    const { name, description, price, stock, category, attributes } = req.body;
    
    // Validate required fields
    if (!name?.trim()) {
      throw new Error('Product name is required');
    }
    if (!description?.trim()) {
      throw new Error('Product description is required');
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      throw new Error('Valid price is required');
    }
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      throw new Error('Valid stock quantity is required');
    }
    if (!category?.trim()) {
      throw new Error('Product category is required');
    }

    console.log('Processing uploaded files...');
    // Handle image paths if files are provided
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded images`);
      // Store relative paths - frontend will construct full URLs using its API_URL
      imagePaths = req.files.map(file => `/uploads/products/${file.filename}`);

      // Validate total upload size only if files are present
      const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > 45 * 1024 * 1024) {
        throw new Error('Total upload size exceeds 45MB. Please reduce image sizes.');
      }
    } else {
      console.log('No images provided, creating product without images');
    }

    console.log('Creating product in database...');
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category.trim(),
      attributes: attributes ? JSON.parse(attributes) : [],
      images: imagePaths,
      status: 'active',
      user_id: req.user.id,
      store_id: req.store.id
    });

    console.log('Creating NFT for product...');
    try {
      // Create NFT for the product
      const tokenURI = JSON.stringify({
        name: product.name,
        description: product.description,
        image: product.images[0], // Use first image as NFT image
        attributes: product.attributes
      });

      const result = await blockchainController.createProduct(
          req.store.wallet_address,
          product.name,
          req.store.name,
          tokenURI
      );

      // Generate verification code for the product
      const verificationCode = crypto
        .createHash('sha256')
        .update(`${product.id}-${Date.now()}-${Math.random()}`)
        .digest('hex');

      // Generate UV hologram with NFT token ID
      console.log('Generating UV hologram with NFT token ID...');
      const hologramPath = await generateProductHologram({
        productId: product.id,
        tokenId: result.tokenId,
        productName: product.name,
        manufacturer: req.store.name,
        orderId: product.id,
        verificationCode: verificationCode,
        storeName: req.store.name,
        uvData: {
          productId: product.id,
          tokenId: result.tokenId,
          verificationCode: verificationCode,
          timestamp: Date.now(),
          storeName: req.store.name,
          productName: product.name
        }
      });

      // Try to update with retry/increment logic for token_id conflicts
      let retryCount = 0;
      const maxRetries = 5;
      let currentTokenId = result.tokenId;
      
      while (retryCount < maxRetries) {
          try {
              await product.update({
                  token_id: currentTokenId.toString(),
                  blockchain_status: 'minted',
                  hologram_path: hologramPath
              });
              break; // Success - exit loop
          } catch (updateError) {
              if (updateError.name === 'SequelizeUniqueConstraintError' && retryCount < maxRetries - 1) {
                  // Increment token ID and try again
                  currentTokenId = (parseInt(currentTokenId) + 1).toString();
                  console.log(`Token ID conflict, trying with ID ${currentTokenId}...`);
                  retryCount++;
                  continue;
              }
              throw updateError;
          }
      }

      console.log('Product and NFT created successfully:', {
        productId: product.id,
        tokenId: result.tokenId
      });
    } catch (blockchainError) {
      console.error('Failed to create NFT:', blockchainError);
      // Don't fail the whole request if blockchain creation fails
      // Just mark it for retry
      await product.update({
        blockchain_status: 'pending'
      });
    }

    clearTimeout(timeout);
    console.log('Product created successfully:', product.id);
    res.status(201).json({ product });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Create product error:', error);
    
    // Handle different types of errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors.map(err => err.message)
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ 
        error: 'Database error occurred while creating product'
      });
    }

    // Handle JSON parse error for attributes
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return res.status(400).json({ 
        error: 'Invalid attributes format'
      });
    }

    res.status(error.status || 500).json({ 
      error: error.message || 'Failed to create product'
    });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'active'
      },
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'is_verified']
      }]
    });
    res.json(products);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all products for a store
router.get('/store/:storeId', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { 
        store_id: req.params.storeId,
        status: 'active'
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get seller's products
router.get('/my-products', requireSeller, validateStore, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { 
        store_id: req.store.id 
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID - must be after other specific routes
router.get('/detail/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id
      },
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'is_verified']
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product
router.put('/:id', requireSeller, validateStore, async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        store_id: req.store.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price, category, quantity, status } = req.body;
    
    await product.update({
      name,
      description, 
      price,
      category,
      quantity,
      status
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', requireSeller, validateStore, async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        store_id: req.store.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;