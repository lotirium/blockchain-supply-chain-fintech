import sequelize from '../config/database.mjs';
import { DataTypes } from 'sequelize';
import User from './User.mjs';
import Store from './Store.mjs';
import Product from './Product.mjs';
import { Order, OrderItem } from './Order.mjs';
import Notification from './Notification.mjs';

// Define model relationships
User.hasOne(Store, {
  foreignKey: 'user_id',
  as: 'ownedStore'
});

Store.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'storeOwner'
});

User.hasMany(Product, {
  foreignKey: 'user_id',
  as: 'listedProducts'
});

Product.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'productSeller'
});

Store.hasMany(Product, {
  foreignKey: 'store_id',
  as: 'products'
});

Product.belongsTo(Store, {
  foreignKey: 'store_id',
  as: 'store'
});

User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'placedOrders'
});

Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'orderPlacer'
});

Store.hasMany(Order, {
  foreignKey: 'store_id',
  as: 'storeOrders'
});

Order.belongsTo(Store, {
  foreignKey: 'store_id',
  as: 'merchantStore'
});

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'orderItems'
});

// Notification relationships
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications'
});

Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Database sync function
export const syncDatabase = async (force = false) => {
  try {
    if (force) {
      // If force is true, drop and recreate everything
      await sequelize.sync({ force: true });
    } else {
      // First create/update tables
      await sequelize.sync({ alter: true });

      // Then handle any column modifications
      try {
        const tableInfo = await sequelize.getQueryInterface().describeTable('users');
        
        // Only proceed with column operations if user_name doesn't exist
        if (!tableInfo.user_name) {
          // Step 1: Add column as nullable
          await sequelize.getQueryInterface().addColumn('users', 'user_name', {
            type: DataTypes.STRING,
            allowNull: true
          });

          // Step 2: Update existing rows with default value
          await sequelize.query(
            `UPDATE users SET user_name = 'User' WHERE user_name IS NULL`
          );

          // Step 3: Modify column to be NOT NULL
          await sequelize.getQueryInterface().changeColumn('users', 'user_name', {
            type: DataTypes.STRING,
            allowNull: false
          });

          console.log('Added and configured user_name column');
        }
      } catch (err) {
        // Log any column operation errors but don't fail
        console.warn('Note: Column operations warning:', err.message);
      }
    }
    console.log('Database synced successfully');
  } catch (error) {
    if (error.name === 'SequelizeDatabaseError') {
      if (error.parent?.code === '42P07') {
        // Index already exists, log warning but don't fail
        console.warn('Warning: Some indexes already exist, continuing anyway');
        console.warn(error.message);
      } else {
        // Other database errors
        console.error('Database error:', error.message);
        throw error;
      }
    } else {
      console.error('Failed to sync database:', error);
      throw error;
    }
  }
};

// Initialize database with default data
export const initializeDatabase = async () => {
  try {
    // Database initialization logic goes here
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Export models
export {
  sequelize,
  User,
  Store,
  Product,
  Order,
  OrderItem,
  Notification
};