import express from 'express';
import {
  Order,
  OrderItem,
  Product,
  Store,
  User,
  Notification,
  OrderStatusHistory
} from '../models/index.mjs';
import auth from '../middleware/auth.mjs';
import sequelize from '../config/database.mjs';

const router = express.Router();

// Create new order
router.post('/', auth(), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, shipping_address, billing_address, payment_info } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    if (!payment_info) {
      return res.status(400).json({ message: 'Payment information is required' });
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
      const store = await Store.findByPk(store_id, { transaction });
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
        payment_method: payment_info?.method || 'credit_card',
        payment_status: 'pending',
        payment_details: {
          last_four: payment_info?.card_number?.slice(-4),
          expiry: payment_info?.expiry,
          card_type: 'credit'
        },
        total_fiat_amount: total,
        shipping_method: 'standard',
        shipping_cost: 0
      }, { transaction });

      // Verify products, check stock, and create order items
      await Promise.all(storeItems.map(async item => {
        const product = await Product.findByPk(item.product_id, {
          lock: true, // Lock the row for update
          transaction
        });

        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }
        if (product.store_id !== store_id) {
          throw new Error(`Product ${item.product_id} does not belong to store ${store_id}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        // Update product stock
        await product.update({
          stock: product.stock - item.quantity
        }, { transaction });

        // Create snapshot of product at time of order
        const productSnapshot = {
          name: product.name,
          description: product.description,
          price: product.price,
          manufacturer: product.manufacturer,
          category: product.category,
          images: product.images,
          attributes: product.attributes
        };

        return OrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          product_snapshot: productSnapshot
        }, { transaction });
      }));

      // Create notification for store owner
      await Notification.create({
        user_id: store.user_id,
        message: `New order received for $${total.toFixed(2)}`,
        type: 'success',
        priority: 10,
        read: false,
        data: {
          order_id: order.id,
          total,
          items_count: storeItems.length,
          customer: {
            name: shipping_address.full_name,
            email: shipping_address.email,
            phone: shipping_address.phone
          },
          shipping_address: {
            full_name: shipping_address.full_name,
            city: shipping_address.city,
            state: shipping_address.state
          },
          items: storeItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            total_price: item.unit_price * item.quantity
          }))
        }
      }, { transaction });

      orders.push({
        ...order.toJSON(),
        items: await OrderItem.findAll({ 
          where: { order_id: order.id },
          transaction
        })
      });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: orders
    });
  } catch (error) {
    await transaction.rollback();
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
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get store orders (seller only)
router.get('/store', auth(['seller']), async (req, res) => {
  try {
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
    console.error('Error fetching store orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get user orders
router.get('/user', auth(), async (req, res) => {
  try {
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
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', auth(), async (req, res) => {
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
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      order.user_id === req.user.id ||
      order.store_id === req.user.ownedStore?.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/:id/status', auth(['seller', 'admin']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { status, notes } = req.body;
    
    console.log('Updating order status:', {
      orderId: req.params.id,
      newStatus: status,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Sellers can only update their own store's orders
    if (req.user.role === 'seller' && order.store_id !== req.user.ownedStore?.id) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    const oldStatus = order.status;

    // Handle stock updates for cancelled orders
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      // Return items to inventory
      await Promise.all(order.items.map(async (item) => {
        const product = await Product.findByPk(item.product_id, {
          lock: true,
          transaction
        });
        
        if (product) {
          await product.update({
            stock: product.stock + item.quantity
          }, { transaction });
        }
      }));
    }
    // If reactivating a cancelled order, remove items from inventory again
    else if (oldStatus === 'cancelled' && status !== 'cancelled') {
      await Promise.all(order.items.map(async (item) => {
        const product = await Product.findByPk(item.product_id, {
          lock: true,
          transaction
        });
        
        if (product) {
          // Ensure we have enough stock to reactivate
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
          }
          
          await product.update({
            stock: product.stock - item.quantity
          }, { transaction });
        }
      }));
    }

    // Record status change in history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: oldStatus,
      to_status: status,
      changed_by: req.user.id,
      notes: notes || `Status changed from ${oldStatus} to ${status}`
    }, { transaction });

    await order.update({ status }, { transaction });
    
    await transaction.commit();

    // Fetch fresh order data
    const updatedOrder = await Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    res.json(updatedOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get order status history
router.get('/:id/status-history', auth(), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      order.user_id === req.user.id ||
      order.store_id === req.user.ownedStore?.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    const history = await OrderStatusHistory.findAll({
      where: { order_id: req.params.id },
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'changedByUser',
        attributes: ['id', 'user_name', 'first_name', 'last_name', 'role']
      }]
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Undo last status change
router.post('/:id/undo-status', auth(['seller', 'admin']), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Sellers can only update their own store's orders
    if (req.user.role === 'seller' && order.store_id !== req.user.ownedStore?.id) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    // Get the last status change
    const lastStatusChange = await OrderStatusHistory.findOne({
      where: { order_id: order.id },
      order: [['created_at', 'DESC']],
      transaction
    });

    if (!lastStatusChange) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No status changes to undo' });
    }

    const oldStatus = lastStatusChange.from_status;
    const currentStatus = order.status;

    // Handle stock updates for status changes
    if (currentStatus === 'cancelled' && oldStatus !== 'cancelled') {
      // Remove items from inventory again
      await Promise.all(order.items.map(async (item) => {
        const product = await Product.findByPk(item.product_id, {
          lock: true,
          transaction
        });
        
        if (product) {
          // Ensure we have enough stock
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
          }
          
          await product.update({
            stock: product.stock - item.quantity
          }, { transaction });
        }
      }));
    }
    // If undoing from cancelled to active status, return items to inventory
    else if (currentStatus !== 'cancelled' && oldStatus === 'cancelled') {
      await Promise.all(order.items.map(async (item) => {
        const product = await Product.findByPk(item.product_id, {
          lock: true,
          transaction
        });
        
        if (product) {
          await product.update({
            stock: product.stock + item.quantity
          }, { transaction });
        }
      }));
    }

    // Record status change in history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: currentStatus,
      to_status: oldStatus,
      changed_by: req.user.id,
      notes: `Undid status change from ${oldStatus} to ${currentStatus}`
    }, { transaction });

    await order.update({ status: oldStatus }, { transaction });
    
    await transaction.commit();

    // Fetch fresh order data
    const updatedOrder = await Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    res.json(updatedOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('Error undoing status change:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;