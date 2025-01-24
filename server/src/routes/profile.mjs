import express from 'express';
import { body } from 'express-validator';
import validateRequest from '../middleware/validateRequest.mjs';
import auth, { requireSeller } from '../middleware/auth.mjs';
import { User, Store } from '../models/index.mjs';
import { ethers } from 'ethers';

const router = express.Router();

// Validation middleware
const updateProfileValidation = [
  body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('walletAddress')
    .optional()
    .custom((value) => {
      if (value && !ethers.isAddress(value)) {
        throw new Error('Invalid Ethereum address');
      }
      return true;
    }),
  body('storeName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Store name cannot be empty'),
  validateRequest,
];

// Routes
router.get('/', auth(), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Store,
        as: 'ownedStore'
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

router.put('/', auth(), updateProfileValidation, async (req, res) => {
  try {
    const { username, email, walletAddress, storeName } = req.body;

    // Check if email is already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    // Update user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (walletAddress) user.walletAddress = walletAddress;

    // Handle store updates for sellers
    if (user.role === 'seller' && storeName) {
      let store = await Store.findOne({ where: { user_id: user.id } });
      if (!store) {
        // Create new store
        store = await Store.create({
          user_id: user.id,
          name: storeName,
          status: 'pending'
        });
      } else {
        // Update existing store
        store.name = storeName;
        await store.save();
      }
    }

    await user.save();

    // Fetch updated user with store info
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Store,
        as: 'ownedStore'
      }]
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Store management routes (seller only)
router.get('/store', requireSeller, async (req, res) => {
  try {
    const store = await Store.findOne({
      where: { user_id: req.user.id }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ message: 'Error fetching store', error: error.message });
  }
});

router.put('/store', requireSeller, async (req, res) => {
  try {
    const {
      description,
      businessEmail,
      businessPhone,
      businessAddress,
      shippingPolicy,
      returnPolicy
    } = req.body;

    let store = await Store.findOne({
      where: { user_id: req.user.id }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Update store fields
    if (description) store.description = description;
    if (businessEmail) store.businessEmail = businessEmail;
    if (businessPhone) store.businessPhone = businessPhone;
    if (businessAddress) store.businessAddress = businessAddress;
    if (shippingPolicy) store.shippingPolicy = shippingPolicy;
    if (returnPolicy) store.returnPolicy = returnPolicy;

    await store.save();

    res.json(store);
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ message: 'Error updating store', error: error.message });
  }
});

// Store verification request (seller only)
router.post('/store/verify', requireSeller, async (req, res) => {
  try {
    const store = await Store.findOne({
      where: { user_id: req.user.id }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.status !== 'pending') {
      return res.status(400).json({ message: 'Store is not in pending status' });
    }

    // Update store status to pending verification
    store.status = 'pending_verification';
    await store.save();

    // TODO: Notify admin about verification request

    res.json({ message: 'Verification request submitted successfully' });
  } catch (error) {
    console.error('Store verification error:', error);
    res.status(500).json({ message: 'Error submitting verification request', error: error.message });
  }
});

export default router;