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
          lock: true,
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

        // Create initial order history entry
        await OrderStatusHistory.create({
          order_id: order.id,
          from_status: 'pending',
          to_status: 'pending',
          changed_by: req.user.id,
          notes: 'Order created'
        }, { transaction });

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
        title: 'New Order Received',
        message: `New order received for $${total.toFixed(2)}`,
        type: 'success',
        priority: 10,
        is_read: false,
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
      attributes: ['id', 'status', 'total_fiat_amount', 'created_at', 'updated_at'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['quantity', 'unit_price', 'total_price'],
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'description']
          }]
        },
        {
          model: Store,
          as: 'merchantStore',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'orderPlacer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
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
      attributes: ['id', 'status', 'total_fiat_amount', 'created_at', 'updated_at'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['quantity', 'unit_price', 'total_price'],
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'description']
          }]
        },
        {
          model: Store,
          as: 'merchantStore',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'orderPlacer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
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
      attributes: ['id', 'status', 'total_fiat_amount', 'created_at', 'updated_at'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['quantity', 'unit_price', 'total_price'],
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'description']
          }]
        },
        {
          model: Store,
          as: 'merchantStore',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'orderPlacer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
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
      attributes: ['id', 'status', 'total_fiat_amount', 'created_at', 'updated_at', 'shipping_address', 'payment_method', 'payment_status', 'user_id', 'store_id'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['quantity', 'unit_price', 'total_price'],
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'description', 'images']
          }]
        },
        {
          model: Store,
          as: 'merchantStore',
          attributes: ['id', 'name', 'business_email', 'business_phone']
        },
        {
          model: User,
          as: 'orderPlacer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: OrderStatusHistory,
          as: 'statusHistory',
          attributes: ['from_status', 'to_status', 'notes', 'created_at'],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions with detailed logging
    console.log('Order access check:', {
      requestUserId: req.user.id,
      userRole: req.user.role,
      orderUserId: order.user_id,
      storeId: order.store_id,
      userStoreId: req.user.ownedStore?.id
    });

    const hasAccess =
      req.user.role === 'admin' || // Admin can access all orders
      (req.user.id === order.user_id) || // User can access their own orders
      (req.user.role === 'seller' && req.user.ownedStore?.id === order.store_id); // Seller can access their store's orders

    if (!hasAccess) {
      console.log('Access denied for order:', {
        orderId: req.params.id,
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(403).json({
        error: 'Not authorized to view this order',
        details: 'You must be the order owner, store owner, or an admin to view this order'
      });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
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

// Update order status
router.patch('/:id/status', auth(['seller', 'admin']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { status } = req.body;
    
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

    // Handle stock updates for status changes
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
      notes: `Status changed from ${oldStatus} to ${status}`
    }, { transaction });

    await order.update({ status }, { transaction });
    
    await transaction.commit();

    // Fetch fresh order data with status history
    const updatedOrder = await Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: OrderStatusHistory,
          as: 'statusHistory',
          limit: 10,
          order: [['created_at', 'DESC']]
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
        },
        {
          model: OrderStatusHistory,
          as: 'statusHistory',
          order: [['created_at', 'DESC']],
          limit: null
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

    if (!order.statusHistory.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No status changes to undo' });
    }

    // Find the next status to revert to by looking for the last change to current status
    let targetStatus = null;
    for (let i = 1; i < order.statusHistory.length; i++) {
      if (order.statusHistory[i].to_status === order.statusHistory[0].from_status) {
        targetStatus = order.statusHistory[i].from_status;
        break;
      }
    }

    // If no previous state found, use the initial from_status
    const oldStatus = targetStatus || order.statusHistory[0].from_status;
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
      notes: `Undid status change back to ${oldStatus}`
    }, { transaction });

    // Update order status
    await order.update({ status: oldStatus }, { transaction });
    
    await transaction.commit();

    // Fetch fresh order data with status history
    const updatedOrder = await Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: OrderStatusHistory,
          as: 'statusHistory',
          order: [['created_at', 'DESC']]
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