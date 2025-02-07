'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update all existing stores to use a temporary type
    await queryInterface.sequelize.query(`
      UPDATE stores SET type = 'manufacturer' WHERE type IS NULL;
    `);

    // Remove the type constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE stores ALTER COLUMN type DROP DEFAULT;
      ALTER TABLE stores ALTER COLUMN type TYPE VARCHAR(255);
    `);

    // Drop the old enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_stores_type;
    `);

    // Create new enum type with just 'seller'
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_stores_type AS ENUM ('seller');
    `);

    // Update all existing records to 'seller'
    await queryInterface.sequelize.query(`
      UPDATE stores SET type = 'seller';
    `);

    // Set the column back to enum type with new default
    await queryInterface.sequelize.query(`
      ALTER TABLE stores 
      ALTER COLUMN type TYPE enum_stores_type USING (type::enum_stores_type),
      ALTER COLUMN type SET DEFAULT 'seller';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // First, update all existing stores to use a temporary type
    await queryInterface.sequelize.query(`
      UPDATE stores SET type = 'manufacturer' WHERE type IS NULL;
    `);

    // Remove the type constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE stores ALTER COLUMN type DROP DEFAULT;
      ALTER TABLE stores ALTER COLUMN type TYPE VARCHAR(255);
    `);

    // Drop the new enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_stores_type;
    `);

    // Create old enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_stores_type AS ENUM ('manufacturer', 'retailer');
    `);

    // Update all existing records to 'manufacturer'
    await queryInterface.sequelize.query(`
      UPDATE stores SET type = 'manufacturer';
    `);

    // Set the column back to enum type with old default
    await queryInterface.sequelize.query(`
      ALTER TABLE stores 
      ALTER COLUMN type TYPE enum_stores_type USING (type::enum_stores_type),
      ALTER COLUMN type SET DEFAULT 'manufacturer';
    `);
  }
};