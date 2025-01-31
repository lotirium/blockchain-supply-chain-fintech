import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.addColumn('products', 'blockchain_status', {
    type: DataTypes.ENUM('pending', 'minted', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  });

  // Create index for faster querying
  await queryInterface.addIndex('products', ['blockchain_status']);
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('products', ['blockchain_status']);
  await queryInterface.removeColumn('products', 'blockchain_status');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_blockchain_status";');
}