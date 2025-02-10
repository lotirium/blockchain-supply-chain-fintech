'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_orders_payment_method" ADD VALUE IF NOT EXISTS 'credit_card';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Cannot remove enum values in PostgreSQL
    // Would need to create a new type without the value and swap
  }
};