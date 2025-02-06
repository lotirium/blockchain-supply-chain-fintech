'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'qr_data', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Stores QR code verification data including codes and timestamps'
    });

    await queryInterface.addColumn('products', 'qr_status', {
      type: Sequelize.ENUM('not_generated', 'active', 'revoked'),
      defaultValue: 'not_generated',
      allowNull: false
    });

    // Add index for faster QR code lookups
    await queryInterface.addIndex('products', ['qr_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('products', ['qr_status']);
    await queryInterface.removeColumn('products', 'qr_status');
    await queryInterface.removeColumn('products', 'qr_data');
    
    // Remove the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_products_qr_status;');
  }
};