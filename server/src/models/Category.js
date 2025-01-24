const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,  // URL-friendly format
      },
    },
    parentId: {
      type: DataTypes.UUID,
      references: {
        model: 'Categories',  // Using string reference instead of direct model reference
        key: 'id',
      },
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'Categories',  // Explicitly set table name
    timestamps: true,
    hooks: {
      beforeValidate: (category) => {
        if (!category.slug && category.name) {
          category.slug = category.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }
      },
    },
    indexes: [
      {
        fields: ['parentId'],
      },
      {
        fields: ['slug'],
        unique: true,
      },
    ],
  }
);

// No associations here - they are all defined in models/index.js

module.exports = Category;