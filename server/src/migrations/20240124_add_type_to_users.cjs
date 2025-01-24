'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First create the ENUM type
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_type') THEN
          CREATE TYPE enum_users_type AS ENUM ('buyer', 'seller');
        END IF;
      END
      $$;
    `);

    // Add the column as nullable first
    await queryInterface.addColumn('users', 'type', {
      type: Sequelize.ENUM('buyer', 'seller'),
      allowNull: true
    });

    // Update existing records
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET type = CASE 
        WHEN role = 'user' THEN 'buyer'::enum_users_type
        WHEN role = 'seller' THEN 'seller'::enum_users_type
        ELSE 'buyer'::enum_users_type
      END;
    `);

    // Now make it non-nullable
    await queryInterface.changeColumn('users', 'type', {
      type: Sequelize.ENUM('buyer', 'seller'),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the column
    await queryInterface.removeColumn('users', 'type');

    // Drop the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_type;
    `);
  }
};