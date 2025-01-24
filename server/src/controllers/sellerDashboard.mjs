import { Op, Sequelize } from 'sequelize';
import { User, Store, Product, Order, Notification } from '../models/index.mjs';

// Helper function to get unread notifications count
const getUnreadNotificationsCount = async (userId) => {
  return await Notification.count({
    where: {
      user_id: userId,
      read: false,
      [Op.or]: [
        { expiry_date: null },
        { expiry_date: { [Op.gt]: new Date() } }
      ]
    }
  });
};

// Helper function to get recent notifications
const getRecentNotifications = async (userId, limit = 5) => {
  return await Notification.findAll({
    where: {
      user_id: userId,
      [Op.or]: [
        { expiry_date: null },
        { expiry_date: { [Op.gt]: new Date() } }
      ]
    },
    order: [
      ['priority', 'DESC'],
      ['created_at', 'DESC']
    ],
    limit
  });
};

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get store and notification data
    const [store, unreadCount, recentNotifications] = await Promise.all([
      Store.findOne({
        where: { user_id: userId },
        attributes: ['id', 'name', 'status', 'type', 'wallet_address']
      }),
      getUnreadNotificationsCount(userId),
      getRecentNotifications(userId)
    ]);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Get stats
    const [totalProducts, totalSales, pendingOrders] = await Promise.all([
      Product.count({
        where: {
          store_id: store.id,
          status: 'active'
        }
      }),
      Order.sum('total_amount', {
        where: {
          store_id: store.id,
          status: 'completed'
        }
      }),
      Order.count({
        where: {
          store_id: store.id,
          status: 'pending'
        }
      })
    ]);

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: {
        store_id: store.id
      },
      include: [{
        model: User,
        as: 'customer',
        attributes: ['id', 'user_name', 'email']
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Format response data
    const dashboardData = {
      store: {
        id: store.id,
        name: store.name,
        status: store.status,
        type: store.type,
        walletAddress: store.wallet_address
      },
      stats: {
        totalProducts: totalProducts || 0,
        totalSales: totalSales || 0,
        pendingOrders: pendingOrders || 0,
        unreadNotifications: unreadCount
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        customer_name: order.customer.user_name,
        total: order.total_amount,
        status: order.status,
        created_at: order.created_at
      })),
      notifications: recentNotifications.map(notification => ({
        id: notification.id,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        read: notification.read,
        created_at: notification.created_at,
        data: notification.data
      }))
    };

    return res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, read } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {
      user_id: userId,
      [Op.or]: [
        { expiry_date: null },
        { expiry_date: { [Op.gt]: new Date() } }
      ]
    };

    if (type) where.type = type;
    if (read !== undefined) where.read = read === 'true';

    // Get notifications with pagination
    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset
    });

    return res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({ read: true });

    return res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { read: true },
      {
        where: {
          user_id: userId,
          read: false
        }
      }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    return res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

export const getStoreStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const store = await Store.findOne({
      where: { user_id: userId }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const dateFilter = {
      created_at: {}
    };

    if (startDate) {
      dateFilter.created_at[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      dateFilter.created_at[Op.lte] = new Date(endDate);
    }

    const [salesStats, orderStats] = await Promise.all([
      // Get sales statistics
      Order.findAll({
        where: {
          store_id: store.id,
          status: 'completed',
          ...dateFilter
        },
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
          [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_sales'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'order_count']
        ],
        group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']]
      }),

      // Get order status statistics
      Order.findAll({
        where: {
          store_id: store.id,
          ...dateFilter
        },
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['status']
      })
    ]);

    return res.json({
      success: true,
      data: {
        salesStats: salesStats.map(stat => ({
          date: stat.date,
          totalSales: parseFloat(stat.total_sales) || 0,
          orderCount: parseInt(stat.order_count) || 0
        })),
        orderStats: orderStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count) || 0;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Failed to fetch store statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch store statistics'
    });
  }
};

export default {
  getDashboardData,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getStoreStats
};