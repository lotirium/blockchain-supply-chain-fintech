import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.mjs';

class OrderStatusHistory extends Model {}

OrderStatusHistory.init({
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
  from_status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ),
    allowNull: false
  },
  to_status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ),
    allowNull: false
  },
  changed_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'OrderStatusHistory',
  tableName: 'order_status_history',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_status_history_order',
      fields: ['order_id']
    },
    {
      name: 'idx_status_history_user',
      fields: ['changed_by']
    }
  ]
});

export default OrderStatusHistory;