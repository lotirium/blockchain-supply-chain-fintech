import express from 'express';
import {
  Order,
  OrderItem,
  Product,
  Store,
  User
} from '../models/index.mjs';
import auth from '../middleware/auth.mjs';

const router = express.Router();

// Get all orders (admin only)
router.get('/', auth(['admin']), async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Store, as: 'merchantStore' },
        { model: User, as: 'orderPlacer' }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching store orders:', {
      userId: req.user?.id,
      storeId: req.user?.ownedStore?.id,
      error: error.message,
      stack: error.stack
    });

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => err.message)
      });
    }

    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        error: 'Database error',
        details: 'An error occurred while querying the database'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get store orders (seller only)
router.get('/store', auth(['seller']), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.ownedStore?.id) {
      return res.status(400).json({ message: 'No store associated with this account' });
    }

    const orders = await Order.findAll({
      where: {
        store_id: req.user.ownedStore.id
      },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Store, as: 'merchantStore' },
        { model: User, as: 'orderPlacer' }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => err.message)
      });
    }

    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        error: 'Database error',
        details: 'An error occurred while querying the database'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get user orders (for logged in user)
router.get('/user', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.id) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Store, as: 'merchantStore' },
        { model: User, as: 'orderPlacer' }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Store, as: 'merchantStore' },
        { model: User, as: 'orderPlacer' }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' &&
        order.user_id !== req.user.id &&
        order.store_id !== req.user.ownedStore?.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (seller and admin only)
router.patch('/:id/status', auth(['seller', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Sellers can only update their own store's orders
    if (req.user.role === 'seller' && order.store_id !== req.user.ownedStore?.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    await order.update({ status });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;