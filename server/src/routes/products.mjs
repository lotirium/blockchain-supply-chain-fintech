import express from 'express';
import { Store, Product } from '../models/index.mjs';
import auth from '../middleware/auth.mjs';

const router = express.Router();

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

// Create product
router.post('/', auth, validateStore, async (req, res) => {
  try {
    const { name, description, price, category, quantity } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      quantity,
      status: 'active',
      user_id: req.user.id,
      store_id: req.store.id
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
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
router.get('/my-products', auth, validateStore, async (req, res) => {
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

// Update product
router.put('/:id', auth, validateStore, async (req, res) => {
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
router.delete('/:id', auth, validateStore, async (req, res) => {
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