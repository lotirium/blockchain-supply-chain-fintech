import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.mjs';
import User from './User.mjs';
import Store from './Store.mjs';
import Product from './Product.mjs';

class Order extends Model {
  toJSON() {
    const values = { ...this.get() };
    // Remove sensitive data if any
    delete values.payment_details;
    return values;
  }
}

class OrderItem extends Model {
  toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Order.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ),
    defaultValue: 'pending'
  },
  total_fiat_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_crypto_amount: {
    type: DataTypes.STRING // Store as string to maintain precision
  },
  payment_method: {
    type: DataTypes.ENUM('crypto', 'fiat'),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  payment_details: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Shipping information
  shipping_address: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  shipping_method: {
    type: DataTypes.STRING
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tracking_number: {
    type: DataTypes.STRING
  },
  // Blockchain transaction details
  transaction_hash: {
    type: DataTypes.STRING
  },
  block_number: {
    type: DataTypes.INTEGER
  },
  // Supply chain tracking
  current_location: {
    type: DataTypes.STRING
  },
  estimated_delivery_date: {
    type: DataTypes.DATE
  },
  actual_delivery_date: {
    type: DataTypes.DATE
  },
  // QR Code tracking
  qr_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Stores QR code verification data including codes and timestamps'
  },
  qr_status: {
    type: DataTypes.ENUM('not_generated', 'active', 'revoked'),
    defaultValue: 'not_generated',
    allowNull: false
  },
  qr_verification_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  qr_last_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Customer feedback
  rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  review: {
    type: DataTypes.TEXT
  },
  review_date: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_orders_user',
      fields: ['user_id']
    },
    {
      name: 'idx_orders_store',
      fields: ['store_id']
    },
    {
      name: 'idx_orders_status',
      fields: ['status']
    },
    {
      name: 'idx_orders_payment_status',
      fields: ['payment_status']
    },
    {
      name: 'idx_orders_transaction',
      fields: ['transaction_hash']
    }
  ]
});

OrderItem.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // NFT transfer details
  token_id: {
    type: DataTypes.STRING
  },
  transfer_hash: {
    type: DataTypes.STRING
  },
  // Product snapshot at time of order
  product_snapshot: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'OrderItem',
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_order_items_order',
      fields: ['order_id']
    },
    {
      name: 'idx_order_items_product',
      fields: ['product_id']
    },
    {
      name: 'idx_order_items_token',
      fields: ['token_id']
    }
  ]
});

export { Order, OrderItem };
export default Order;