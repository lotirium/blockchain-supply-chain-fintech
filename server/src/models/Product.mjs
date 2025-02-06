import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.mjs';
import User from './User.mjs';
import Store from './Store.mjs';

class Product extends Model {
  toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Product.init({
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
  token_id: {
    type: DataTypes.STRING,
    unique: true
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
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  manufacturer: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'inactive', 'sold_out'),
    defaultValue: 'draft'
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  attributes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // NFT-related fields
  token_uri: {
    type: DataTypes.STRING
  },
  blockchain_status: {
    type: DataTypes.ENUM('pending', 'minted', 'failed'),
    defaultValue: 'pending'
  },
  hologram_data: {
    type: DataTypes.JSONB
  },
  // QR code fields
  qr_data: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  qr_status: {
    type: DataTypes.ENUM('not_generated', 'active', 'revoked'),
    defaultValue: 'not_generated',
    allowNull: false
  },
  // Supply chain fields
  shipment_stage: {
    type: DataTypes.STRING
  },
  shipment_location: {
    type: DataTypes.STRING
  },
  // Analytics fields
  total_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_sales: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  total_reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['store_id']
    },
    {
      unique: true,
      fields: ['token_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['category']
    }
  ]
});

export default Product;