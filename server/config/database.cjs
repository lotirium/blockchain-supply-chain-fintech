const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'shipment_user',
    password: process.env.DB_PASSWORD || 'shipment_password_123',
    database: process.env.DB_NAME || 'shipment_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      underscored: true,
      timestamps: true
    },
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_data'
  },
  test: {
    username: process.env.DB_USER || 'shipment_user',
    password: process.env.DB_PASSWORD || 'shipment_password_123',
    database: process.env.TEST_DB_NAME || 'shipment_test_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};