'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM type for order statuses if not exists
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_order_status" AS ENUM (
          'pending',
          'confirmed',
          'packed',
          'shipped',
          'delivered',
          'cancelled',
          'refunded'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create order status history table
    await queryInterface.createTable('order_status_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      from_status: {
        type: Sequelize.ENUM,
        values: [
          'pending',
          'confirmed',
          'packed',
          'shipped',
          'delivered',
          'cancelled',
          'refunded'
        ],
        allowNull: false
      },
      to_status: {
        type: Sequelize.ENUM,
        values: [
          'pending',
          'confirmed',
          'packed',
          'shipped',
          'delivered',
          'cancelled',
          'refunded'
        ],
        allowNull: false
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION'
      },
      notes: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('order_status_history', ['order_id'], {
      name: 'idx_status_history_order'
    });
    await queryInterface.addIndex('order_status_history', ['changed_by'], {
      name: 'idx_status_history_user'
    });
    await queryInterface.addIndex('order_status_history', ['deleted_at'], {
      name: 'idx_status_history_deleted_at'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('order_status_history', 'idx_status_history_order');
    await queryInterface.removeIndex('order_status_history', 'idx_status_history_user');
    await queryInterface.removeIndex('order_status_history', 'idx_status_history_deleted_at');

    // Drop the table
    await queryInterface.dropTable('order_status_history');

    // Note: We don't drop the ENUM type as it might be used by other tables
  }
};