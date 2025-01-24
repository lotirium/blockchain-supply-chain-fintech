const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Store } = require('../models');
const { Op, sequelize } = require('../config/database');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', { ...req.body, password: '***' });

    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({
        message: 'Request body is missing'
      });
    }

    // Safely extract values with null coalescing
    const email = req.body.email ?? null;
    const password = req.body.password ?? null;
    const userName = req.body.username ?? null; // Accept from request as username
    const role = req.body.role ?? null;

    console.log('Extracted values:', { email, userName, role, hasPassword: !!password });

    // Validate required fields
    if (!email || !password || !userName || !role) {
      return res.status(400).json({
        message: 'Please provide all required fields: email, password, username, and role'
      });
    }

    // Validate username - only trim if userName exists
    let trimmedUserName;
    try {
      trimmedUserName = userName.trim();
    } catch (error) {
      console.error('Error trimming username:', error);
      return res.status(400).json({
        message: 'Invalid username format'
      });
    }

    if (!trimmedUserName) {
      return res.status(400).json({
        message: 'Username cannot be empty'
      });
    }
    if (trimmedUserName.length < 3) {
      return res.status(400).json({
        message: 'Username must be at least 3 characters long'
      });
    }
    if (trimmedUserName.includes(' ')) {
      return res.status(400).json({
        message: 'Username cannot contain spaces'
      });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUserName)) {
      return res.status(400).json({
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    // Validate role value
    if (!['seller', 'buyer'].includes(role)) {
      return res.status(400).json({
        message: "Role must be either 'seller' or 'buyer'"
      });
    }

    // Check if user already exists (both email and username)
    console.log('Checking for existing user with email:', email);
    let existingUser = await User.findOne({
      where: { email }
    });

    if (!existingUser) {
      console.log('Checking for existing user with username:', trimmedUserName);
      existingUser = await User.findOne({
        where: { user_name: trimmedUserName }
      });
    }

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Extract store data for sellers
    const storeData = role === 'seller' ? {
      name: req.body.storeName,
      description: req.body.storeDescription,
      businessEmail: req.body.businessEmail,
      businessPhone: req.body.businessPhone,
      businessAddress: req.body.businessAddress
    } : null;

    // Validate store data for sellers
    if (role === 'seller') {
      if (!storeData.name) {
        return res.status(400).json({
          message: 'Store name is required for seller registration'
        });
      }
      if (storeData.name.length < 3 || storeData.name.length > 100) {
        return res.status(400).json({
          message: 'Store name must be between 3 and 100 characters'
        });
      }
    }

    // Create user with explicit values
    const userData = {
      email,
      password,
      user_name: trimmedUserName,
      role: role === 'seller' ? 'seller' : 'buyer',
    };

    console.log('Attempting to create user with data:', { ...userData, password: '***' });

    // Use transaction to ensure both user and store are created or neither
    const result = await sequelize.transaction(async (t) => {
      const user = await User.create(userData, { transaction: t });

      if (role === 'seller' && storeData) {
        await Store.create({
          ...storeData,
          userId: user.id,
          status: 'pending'
        }, { transaction: t });
      }

      return user;
    });

    const user = result;

    // Create custodial wallet for the user
    console.log('Creating custodial wallet for user:', user.id);
    try {
      const walletAddress = await user.createCustodialWallet();
      console.log('Custodial wallet created:', walletAddress);
    } catch (walletError) {
      console.error('Error creating custodial wallet:', walletError);
      // Don't fail registration if wallet creation fails
      // We can retry wallet creation later
    }

    // Generate token
    const token = user.generateAuthToken();

    // Load store data for sellers
    let store = null;
    if (role === 'seller') {
      store = await Store.findOne({ where: { userId: user.id } });
    }

    // Return user data, store data, and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.user_name, // Return as username for API compatibility
        role: user.role,
        walletAddress: user.walletAddress,
        isStoreVerified: user.isStoreVerified
      },
      store,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Duplicate value error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: `${err.path} is already taken`
        }))
      });
    }

    // Handle any other unexpected errors
    res.status(500).json({
      message: 'An error occurred during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with store data if seller
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Store,
          as: 'ownedStore',
          required: false
        }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = user.generateAuthToken();

    // Get store from eager loaded relation
    const store = user.role === 'seller' ? user.ownedStore : null;

    // Return user data, store data, and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.user_name, // Return as username for API compatibility
        role: user.role,
        walletAddress: user.walletAddress,
        isStoreVerified: user.isStoreVerified
      },
      store,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user with store data if seller
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Store,
          as: 'ownedStore',
          required: false
        }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get store from eager loaded relation
    const store = user.role === 'seller' ? user.ownedStore : null;

    // Return user data and store data
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.user_name, // Return as username for API compatibility
        role: user.role,
        walletAddress: user.walletAddress,
        isStoreVerified: user.isStoreVerified
      },
      store
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
});

module.exports = router;