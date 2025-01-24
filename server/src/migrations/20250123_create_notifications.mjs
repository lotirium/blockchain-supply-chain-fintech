import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  // Create notifications table
  await queryInterface.createTable('notifications', {
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
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
      defaultValue: 'info'
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Add indexes
  await queryInterface.addIndex('notifications', ['user_id'], {
    name: 'notifications_user_id_idx'
  });

  await queryInterface.addIndex('notifications', ['read'], {
    name: 'notifications_read_idx'
  });

  await queryInterface.addIndex('notifications', ['type'], {
    name: 'notifications_type_idx'
  });

  await queryInterface.addIndex('notifications', ['created_at'], {
    name: 'notifications_created_at_idx'
  });

  // Add composite index for user_id and read status
  await queryInterface.addIndex('notifications', ['user_id', 'read'], {
    name: 'notifications_user_unread_idx'
  });
};

export const down = async (queryInterface) => {
  // Remove indexes first
  await queryInterface.removeIndex('notifications', 'notifications_user_id_idx');
  await queryInterface.removeIndex('notifications', 'notifications_read_idx');
  await queryInterface.removeIndex('notifications', 'notifications_type_idx');
  await queryInterface.removeIndex('notifications', 'notifications_created_at_idx');
  await queryInterface.removeIndex('notifications', 'notifications_user_unread_idx');

  // Drop the notifications table
  await queryInterface.dropTable('notifications');
};

export default { up, down };