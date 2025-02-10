import express from 'express';
import {
  Order,
  OrderItem,
  Product,
  Store,
  User,
  Notification
} from '../models/index.mjs';
import auth from '../middleware/auth.mjs';

const router = express.Router();

// Create new order
router.post('/', auth(), async (req, res) => {
  try {
    const { items, shipping_address, billing_address } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    // Group items by store
    const itemsByStore = items.reduce((acc, item) => {
      if (!item.store_id) {
        throw new Error('All items must have a valid store_id');
      }
      if (!acc[item.store_id]) {
        acc[item.store_id] = [];
      }
      acc[item.store_id].push(item);
      return acc;
    }, {});

    const orders = [];

    // Create orders for each store
    for (const [store_id, storeItems] of Object.entries(itemsByStore)) {
      const store = await Store.findByPk(store_id);
      if (!store) {
        throw new Error(`Store not found: ${store_id}`);
      }

      // Calculate total
      const total = storeItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

      // Create order
      const order = await Order.create({
        user_id: req.user.id,
        store_id,
        status: 'pending',
        shipping_address,
        billing_address,
        payment_method: 'credit_card',
        payment_status: 'pending',
        total_fiat_amount: total,
        shipping_method: 'standard',
        shipping_cost: 0
      });

      // Verify all products exist and belong to the store
      await Promise.all(storeItems.map(async item => {
        const product = await Product.findByPk(item.product_id);
        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }
        if (product.store_id !== store_id) {
          throw new Error(`Product ${item.product_id} does not belong to store ${store_id}`);
        }
        return product;
      }));

      // Create order items
      await Promise.all(storeItems.map(item =>
        OrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity
        })
      ));

      // Create notification for store owner
      await Notification.create({
        user_id: store.user_id,
        message: `New order received for $${total.toFixed(2)}`,
        type: 'order_received',
        priority: 'high',
        read: false,
        data: {
          order_id: order.id,
          total,
          items_count: storeItems.length
        }
      });

      orders.push({
        ...order.toJSON(),
        items: await OrderItem.findAll({ where: { order_id: order.id } })
      });
    }

    res.status(201).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
});

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