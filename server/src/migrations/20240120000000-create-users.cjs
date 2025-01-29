'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First create the role enum type
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
          CREATE TYPE "enum_users_role" AS ENUM('user', 'seller', 'admin');
        END IF;
      END$$;
    `);

    // Then create the type enum type
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_type') THEN
          CREATE TYPE "enum_users_type" AS ENUM('buyer', 'seller', 'admin');
        END IF;
      END$$;
    `);

    const options = {
      underscored: true,
      timestamps: true,
      tableName: '"users"'
    };

    await queryInterface.createTable(options.tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      user_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: "enum_users_role",
        defaultValue: 'user'
      },
      type: {
        type: "enum_users_type",
        allowNull: false,
        defaultValue: 'buyer'
      },
      wallet_address: {
        type: Sequelize.STRING
      },
      encrypted_private_key: {
        type: Sequelize.TEXT
      },
      iv: {
        type: Sequelize.STRING
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, options);
  },

  async down(queryInterface, Sequelize) {
    const options = {
      tableName: '"users"'
    };
    
    await queryInterface.dropTable(options.tableName);
    
    // Drop the enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_role";
      DROP TYPE IF EXISTS "enum_users_type";
    `);
  }
};