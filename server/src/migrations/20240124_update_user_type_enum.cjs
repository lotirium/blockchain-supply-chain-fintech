'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, create a new ENUM type with the additional value
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_users_type ADD VALUE IF NOT EXISTS 'admin';
    `);

    // Update existing admin users to have admin type
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET type = 'admin'::enum_users_type
      WHERE role = 'admin';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Update any admin type users back to buyer
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET type = 'buyer'::enum_users_type
      WHERE type = 'admin'::enum_users_type;
    `);

    // Note: PostgreSQL doesn't support removing values from an ENUM type
    // We'll leave the 'admin' value in the ENUM for safety
  }
};