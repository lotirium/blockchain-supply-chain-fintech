import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.mjs';
import User from './User.mjs';

class Store extends Model {
  static associate(models) {
    // Define association with User
    Store.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'storeOwner'
    });
  }

  toJSON() {
    const values = { ...this.get() };
    // Remove sensitive data if any
    delete values.payment_details;
    return values;
  }
}

Store.init({
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'pending_verification', 'active', 'suspended'),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('seller'),
    allowNull: false,
    defaultValue: 'seller',
    validate: {
      isIn: [['seller']]
    }
  },
  business_email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  business_phone: {
    type: DataTypes.STRING
  },
  business_address: {
    type: DataTypes.TEXT
  },
  payment_details: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  logo: {
    type: DataTypes.STRING
  },
  banner: {
    type: DataTypes.STRING
  },
  shipping_policy: {
    type: DataTypes.TEXT
  },
  return_policy: {
    type: DataTypes.TEXT
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_date: {
    type: DataTypes.DATE
  },
  blockchain_verification_date: {
    type: DataTypes.DATE
  },
  wallet_address: {
    type: DataTypes.STRING,
    allowNull: false, // Required for all stores
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/,
      validateWalletAddress(value) {
        if (!value || !value.match(/^0x[a-fA-F0-9]{40}$/)) {
          throw new Error('Invalid Ethereum wallet address format');
        }
      }
    }
  },
  private_key: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[a-fA-F0-9]{64}$/,
      validatePrivateKey(value) {
        if (!value || !value.match(/^[a-fA-F0-9]{64}$/)) {
          throw new Error('Invalid Ethereum private key format');
        }
      }
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  total_sales: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_products: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_orders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Store',
  tableName: 'stores',
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    },
    {
      unique: true,
      fields: ['name']
    }
  ]
});

export default Store;