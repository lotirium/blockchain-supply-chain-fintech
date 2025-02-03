import express from 'express';
import { body } from 'express-validator';
import validateRequest from '../middleware/validateRequest.mjs';
import auth from '../middleware/auth.mjs';
import { User, Store } from '../models/index.mjs';
import { ethers } from 'ethers';
import { promises as fs } from 'fs';
import supplyChainArtifact from '../contracts/SupplyChain.json' assert { type: "json" };

const router = express.Router();

// Initialize blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL || 'http://127.0.0.1:8545');
const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
const supplyChain = new ethers.Contract(
  process.env.SUPPLY_CHAIN_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  supplyChainArtifact.abi,
  deployerWallet
);

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
  validateRequest,
];

// Routes
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { username: user_name, email, password, userType, walletAddress, store, firstName, lastName } = req.body;

    // Validate and map user type to role
    if (!userType || !['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type. Must be either buyer or seller' });
    }

    // Validate required name fields
    if (!firstName?.trim()) {
      return res.status(400).json({ message: 'First name is required' });
    }
    if (!lastName?.trim()) {
      return res.status(400).json({ message: 'Last name is required' });
    }

    const mappedRole = userType === 'buyer' ? 'user' : 'seller';

    // Check if user already exists with any role
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with strict role and type assignment
    let user;
    try {
      user = await User.create({
        user_name,
        email,
        password,
        role: mappedRole,
        type: userType, // Store original user type (buyer/seller)
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_email_verified: false,
        last_login: new Date()
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
        try {
          // Generate a new wallet for the store
          const newWallet = ethers.Wallet.createRandom();
          
          // Save store with wallet address and private key
          await Store.create({
            user_id: user.id,
            name: store.name,
            description: store.description || '',
            business_email: email,
            business_phone: store.business_phone,
            business_address: store.business_address,
            status: 'pending_verification',
            is_verified: false,
            created_at: new Date(),
            updated_at: new Date(),
            wallet_address: newWallet.address,
            private_key: newWallet.privateKey.slice(2) // Remove '0x' prefix
          });

          // Get current nonce
          const nonce = await provider.getTransactionCount(deployerWallet.address);

          // Fund the wallet first
          const fundingTx = await deployerWallet.sendTransaction({
            to: newWallet.address,
            value: ethers.parseEther('100.0'),
            nonce: nonce
          });
          await fundingTx.wait();

          // Then grant retailer role
          const grantTx = await supplyChain.grantRetailerRole(newWallet.address, {
            nonce: nonce + 1
          });
          await grantTx.wait();

          // Add to environment variables
          const envVarName = `STORE_${newWallet.address.slice(2).toUpperCase()}_KEY`;
          process.env[envVarName] = newWallet.privateKey;

          console.log(`Store wallet ${newWallet.address} created, granted retailer role and funded with 100 ETH`);

        } catch (walletError) {
          console.error('Failed to setup store wallet:', walletError);
          throw new Error('Failed to setup store wallet: ' + walletError.message);
        }
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
        firstName: userData.first_name,
        lastName: userData.last_name,
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
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    // Simple user lookup by email
    const user = await User.unscoped().findOne({
      where: { email },
      include: [{
        model: Store,
        as: 'ownedStore',
        required: false
      }]
    });

    if (!user) {
      console.log('Login failed: No user found with email:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password'
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
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        walletAddress: userData.wallet_address,
        lastLogin: userData.lastLogin,
        store: userData.ownedStore ? {
          id: userData.ownedStore.id,
          name: userData.ownedStore.name,
          status: userData.ownedStore.status,
          type: userData.ownedStore.type,
          is_verified: userData.ownedStore.is_verified,
          business_email: userData.ownedStore.business_email,
          business_phone: userData.ownedStore.business_phone,
          business_address: userData.ownedStore.business_address,
          wallet_address: userData.ownedStore.wallet_address
        } : null
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

    // Get user data with stor
    const userData = user.toJSON();
    
    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.user_name,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        walletAddress: userData.wallet_address,
        lastLogin: userData.lastLogin,
        store: userData.ownedStore ? {
          id: userData.ownedStore.id,
          name: userData.ownedStore.name,
          status: userData.ownedStore.status,
          type: userData.ownedStore.type,
          is_verified: userData.ownedStore.is_verified,
          business_email: userData.ownedStore.business_email,
          business_phone: userData.ownedStore.business_phone,
          business_address: userData.ownedStore.business_address,
          wallet_address: userData.ownedStore.wallet_address
        } : null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

export default router;