'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'qr_data', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Stores QR code verification data including codes and timestamps'
    });

    await queryInterface.addColumn('orders', 'qr_status', {
      type: Sequelize.ENUM('not_generated', 'active', 'revoked'),
      defaultValue: 'not_generated',
      allowNull: false
    });

    await queryInterface.addColumn('orders', 'qr_verification_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('orders', 'qr_last_verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add index for faster QR code lookups
    await queryInterface.addIndex('orders', ['qr_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('orders', ['qr_status']);
    await queryInterface.removeColumn('orders', 'qr_last_verified_at');
    await queryInterface.removeColumn('orders', 'qr_verification_count');
    await queryInterface.removeColumn('orders', 'qr_status');
    await queryInterface.removeColumn('orders', 'qr_data');
    
    // Remove the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_orders_qr_status;');
  }
};