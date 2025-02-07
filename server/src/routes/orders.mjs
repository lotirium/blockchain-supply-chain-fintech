import express from 'express';
import {
  Order,
  OrderItem,
  Product,
  Store,
  User
} from '../models/index.mjs';
import auth from '../middleware/auth.mjs';
import { generateOrderQR } from '../controllers/qrcode.mjs';
import { WebSocketServer } from 'ws';

// Initialize WebSocket server
const wss = new WebSocketServer({ noServer: true });
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'auth' && data.token && data.userId) {
        // Store the authenticated connection with user info
        clients.set(ws, { 
          token: data.token,
          userId: data.userId
        });
        console.log(`WebSocket client authenticated for user: ${data.userId}`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Export WebSocket server for use in app.mjs
export const wsServer = wss;

const router = express.Router();

// Create new order
router.post('/', auth, async (req, res) => {
  let createdOrder = null;
  try {
    console.log('🔍 Processing order request:', {
      userId: req.user?.id,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer [redacted]' : 'none',
        'accept': req.headers['accept'],
        'origin': req.headers['origin']
      }
    });

    console.log('🔄 Request body validation:', {
      hasItems: !!req.body.items?.length,
      itemCount: req.body.items?.length,
      hasShippingAddress: !!req.body.shippingAddress,
      hasPaymentMethod: !!req.body.paymentMethod,
      hasShippingMethod: !!req.body.shippingMethod
    });

    const {
      items,
      shippingAddress,
      paymentMethod,
      shippingMethod
    } = req.body;

    if (!items?.length) {
      console.log('❌ Order validation failed: No items provided');
      return res.status(400).json({ message: 'Order must contain items' });
    }

    console.log('🔍 Finding products and store...');
    const startTime = Date.now();

    // Optimize database queries by including all necessary data in one go
    const store = await Store.findOne({
      where: { id: items[0].storeId },
      include: [
        { model: User, as: 'owner' },
        {
          model: Product,
          as: 'products',
          where: {
            id: items.map(item => item.productId)
          }
        }
      ]
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const products = store.products;

    console.log('✅ Found products and store:', {
      productsFound: products.length,
      storeId: store.id,
      duration: `${Date.now() - startTime}ms`
    });

    // Validate products
    if (products.length !== items.length) {
      return res.status(404).json({ 
        message: 'Some products were not found' 
      });
    }

    // Calculate totals and prepare order items
    const totalAmount = products.reduce((sum, product, index) => 
      sum + (product.price * items[index].quantity), 0);

    const orderItems = products.map((product, index) => ({
      product_id: product.id,
      quantity: items[index].quantity,
      unit_price: product.price,
      total_price: product.price * items[index].quantity,
      product_snapshot: product.toJSON()
    }));

    console.log('📝 Creating order and items in transaction...');
    
    // Set transaction timeout and isolation level
    const transaction = await Order.sequelize.transaction({
      timeout: 30000, // 30 second timeout
      isolationLevel: Order.sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // Create order and items in parallel
      const [order, createdItems] = await Promise.all([
        Order.create({
          user_id: req.user.id,
          store_id: store.id,
          total_fiat_amount: totalAmount,
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          shipping_method: shippingMethod,
          status: 'confirmed',
          payment_status: 'completed'
        }, { transaction }),
        OrderItem.bulkCreate(
          orderItems.map(item => ({ 
            ...item
          })),
          { transaction }
        )
      ]);

      // Update order items with order ID
      await Promise.all(
        createdItems.map(item =>
          item.update({ order_id: order.id }, { transaction })
        )
      );

      // Commit transaction
      await transaction.commit();
      createdOrder = order;

      console.log(`⏱️ Order created in ${Date.now() - startTime}ms`);

      // Send response immediately
      res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          status: order.status,
          total: totalAmount
        }
      });

      // Process WebSocket notifications after response is sent
      setImmediate(async () => {
        try {
          if (store?.owner) {
            const notification = JSON.stringify({
              type: 'new_order',
              payload: {
                orderId: order.id,
                total: totalAmount,
                status: order.status,
                items: orderItems.map(item => ({
                  productId: item.product_id,
                  quantity: item.quantity,
                  price: item.unit_price
                }))
              }
            });

            // Only send notification to the store owner
            for (const [ws, client] of clients) {
              if (client.token && client.userId === store.owner.id && ws.readyState === ws.OPEN) {
                try {
                  await ws.send(notification);
                } catch (wsError) {
                  console.error('Failed to send WebSocket notification:', wsError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in async notification processing:', error);
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

    console.log(`⏱️ Total processing time: ${Date.now() - startTime}ms`);
    console.log('✅ Order created successfully, QR code can be generated on demand');
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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