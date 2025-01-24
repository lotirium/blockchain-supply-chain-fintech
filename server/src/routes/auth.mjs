import express from 'express';
import { body } from 'express-validator';
import validateRequest from '../middleware/validateRequest.mjs';
import auth from '../middleware/auth.mjs';
import { User, Store } from '../models/index.mjs';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'seller'])
    .withMessage('Invalid role. Must be one of: user, seller'),
  body('userType')
    .optional()
    .isIn(['buyer', 'seller'])
    .withMessage('Invalid user type. Must be one of: buyer, seller'),
  validateRequest,
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  body('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn(['buyer', 'seller'])
    .withMessage('Invalid user type. Must be one of: buyer, seller'),
  validateRequest,
];

// Routes
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { username: user_name, email, password, userType, walletAddress, store } = req.body;

    // Use userType directly as role, with 'user' for buyers
    const mappedRole = userType === 'buyer' ? 'user' : userType;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    let user;
    try {
      user = await User.create({
        user_name,
        email,
        password,
        role: mappedRole
      });
    } catch (error) {
      console.error('Failed to create user account:', error);
      if (user) await user.destroy();
      return res.status(500).json({ 
        success: false,
        message: 'Failed to create user account. Please try again.' 
      });
    }

    // Create store for sellers
    if (mappedRole === 'seller' && store) {
      try {
        await Store.create({
          user_id: user.id,
          name: store.name,
          description: store.description || '',
          business_email: email,
          business_phone: store.phone,
          business_address: store.address,
          status: 'active',
          is_verified: true,
          verification_date: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
      } catch (error) {
        console.error('Failed to create store:', error);
        // Cleanup: Delete user if store creation fails
        if (user) await user.destroy();
        throw new Error('Failed to create store: ' + error.message);
      }
    }

    // Fetch user with store data (limited fields)
    const userWithStore = await User.findByPk(user.id, {
      include: [{
        model: Store,
        as: 'ownedStore',
        attributes: ['id', 'name', 'status', 'type', 'wallet_address']
      }]
    });

    // Generate auth token
    const token = userWithStore.generateAuthToken();

    // Get user data with store
    const userData = userWithStore.toJSON();
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.user_name,
        role: userData.role,
        walletAddress: userData.wallet_address,
        lastLogin: userData.lastLogin,
        store: userData.ownedStore ? {
          id: userData.ownedStore.id,
          name: userData.ownedStore.name,
          status: userData.ownedStore.status,
          type: userData.ownedStore.type,
          walletAddress: userData.ownedStore.wallet_address
        } : null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Sequelize unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }
    
    // Handle other errors without exposing internal details
    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again later.' 
    });
  }
});

router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    console.log('Login attempt:', { email, userType });

    // Use userType directly as role, with 'user' for buyers
    const role = userType === 'buyer' ? 'user' : userType;

    // Find user with role check
    const user = await User.findOne({
      where: { 
        email,
        role: role
      },
      include: [{
        model: Store,
        as: 'ownedStore'
      }]
    });

    if (!user) {
      console.log('Login failed: No user found with email and type:', { email, userType });
      return res.status(401).json({ 
        message: userType === 'seller' 
          ? 'No seller account found with this email' 
          : 'No buyer account found with this email'
      });
    }

    console.log('User found, verifying password...');

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('Login failed: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Password verified successfully for user:', email);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    // Get user data with store
    const userData = user.toJSON();
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.user_name,
        role: userData.role,
        walletAddress: userData.wallet_address,
        lastLogin: userData.lastLogin,
        store: userData.ownedStore || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    // In a real application, you might want to invalidate the token here
    // For now, we'll just send a success response
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Store,
        as: 'ownedStore'
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user data with store
    const userData = user.toJSON();
    
    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.user_name,
        role: userData.role,
        walletAddress: userData.wallet_address,
        lastLogin: userData.lastLogin,
        store: userData.ownedStore || null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

export default router;