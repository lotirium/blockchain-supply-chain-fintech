import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.mjs';

class Notification extends Model {
  static associate(models) {
    // Define associations here
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  // Instance methods
  async markAsRead() {
    this.is_read = true;
    await this.save();
  }

  isExpired() {
    if (!this.expiry_date) return false;
    return new Date() > this.expiry_date;
  }

  toJSON() {
    const values = { ...this.get() };
    // Remove sensitive data if any
    delete values.data?.internal;
    return values;
  }
}

Notification.init({
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
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Untitled',
    validate: {
      notEmpty: true
    }
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {},
    validate: {
      isValidJSON(value) {
        try {
          if (value) JSON.stringify(value);
        } catch (error) {
          throw new Error('Invalid JSON data');
        }
      }
    }
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true,
      isFuture(value) {
        if (value && new Date(value) <= new Date()) {
          throw new Error('Expiry date must be in the future');
        }
      }
    }
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'is_read']
    }
  ]
});

export default Notification;