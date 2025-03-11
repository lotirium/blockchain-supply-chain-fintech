import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.mjs';

class Store extends Model {
  toJSON() {
    // Get raw values
    const values = Object.assign({}, this.get());
    
    // Log the raw values before modification
    console.log('Store raw values:', values);
    
    // Remove only sensitive data while keeping everything else
    delete values.payment_details;
    delete values.private_key;
    
    // Ensure all defined fields are included
    const fieldsToInclude = [
      'id',
      'user_id',
      'name',
      'description',
      'status',
      'type',
      'business_email',
      'business_phone',
      'business_address',
      'logo',
      'banner',
      'shipping_policy',
      'return_policy',
      'is_verified',
      'verification_date',
      'blockchain_verification_date',
      'wallet_address',
      'rating',
      'total_sales',
      'total_products',
      'total_orders',
      'createdAt',
      'updatedAt'
    ];

    // Ensure all fields are present, even if null
    const result = {};
    fieldsToInclude.forEach(field => {
      result[field] = values[field];
    });

    // Log the final serialized object
    console.log('Store serialized:', result);
    
    return result;
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
    type: DataTypes.ENUM('manufacturer', 'retailer'),
    allowNull: true,
    defaultValue: 'manufacturer',
    validate: {
      isIn: [['manufacturer', 'retailer']]
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
    allowNull: false,
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