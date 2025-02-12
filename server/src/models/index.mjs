import { Order, OrderItem } from './Order.mjs';
import OrderStatusHistory from './OrderStatusHistory.mjs';
import Product from './Product.mjs';
import Store from './Store.mjs';
import User from './User.mjs';
import Notification from './Notification.mjs';

// Define relationships
User.hasOne(Store, { foreignKey: 'user_id', as: 'ownedStore' });
Store.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });
Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'orderPlacer' });

Store.hasMany(Order, { foreignKey: 'store_id', as: 'receivedOrders' });
Order.belongsTo(Store, { foreignKey: 'store_id', as: 'merchantStore' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order Status History relations
Order.hasMany(OrderStatusHistory, { 
  foreignKey: 'order_id', 
  as: 'statusHistory',
  onDelete: 'CASCADE'
});
OrderStatusHistory.belongsTo(Order, { 
  foreignKey: 'order_id', 
  as: 'order'
});
OrderStatusHistory.belongsTo(User, { 
  foreignKey: 'changed_by', 
  as: 'changedByUser'
});

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Helper functions
export const syncDatabase = async (force = false) => {
  // Drop tables in reverse dependency order
  if (force) {
    await Promise.all([
      OrderItem.drop({ cascade: true }),
      OrderStatusHistory.drop({ cascade: true }),
      Notification.drop({ cascade: true })
    ]);
    await Promise.all([
      Order.drop({ cascade: true }),
      Product.drop({ cascade: true })
    ]);
    await Store.drop({ cascade: true });
    await User.drop({ cascade: true });
  }

  // Create tables in dependency order
  await User.sync({ force });
  await Store.sync({ force });
  await Product.sync({ force });
  await Order.sync({ force });
  await Promise.all([
    OrderItem.sync({ force }),
    OrderStatusHistory.sync({ force }),
    Notification.sync({ force })
  ]);
};

export const initializeDatabase = async () => {
  // Add any initial data or default values here
};

export {
  User,
  Store,
  Product,
  Order,
  OrderItem,
  OrderStatusHistory,
  Notification
};