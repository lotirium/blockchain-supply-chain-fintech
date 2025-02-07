const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'shipment_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true
    },
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_data',
    pool: {
      max: 20,          // Increased max connections
      min: 2,           // Maintain minimum connections
      acquire: 60000,   // 60 second acquire timeout
      idle: 10000       // Keep 10 second idle timeout
    },
    dialectOptions: {
      statement_timeout: 30000,  // 30 second statement timeout
      idle_in_transaction_session_timeout: 30000  // 30 second transaction timeout
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
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
      max: 10,          // Increased from 5
      min: 2,           // Maintain minimum connections
      acquire: 60000,   // 60 second acquire timeout
      idle: 10000       // Keep 10 second idle timeout
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};