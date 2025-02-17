import express from 'express';
import auth from '../middleware/auth.mjs';
import { User, Store } from '../models/index.mjs';

const router = express.Router();

// Get user profile
router.get('/', auth(), async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findByPk(req.user.id, {
      attributes: { 
        exclude: ['password'],
        include: [
          'id', 'email', 'user_name', 'first_name', 'last_name', 
          'role', 'type', 'wallet_address', 'is_email_verified', 
          'last_login', 'created_at', 'updated_at'
        ]
      },
      include: [{
        model: Store,
        as: 'ownedStore',
        attributes: { exclude: ['payment_details'] }
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = user.toJSON();
    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.user_name,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        wallet_address: userData.wallet_address,
        lastLogin: userData.last_login,
        store: userData.ownedStore ? {
          id: userData.ownedStore.id,
          name: userData.ownedStore.name,
          status: userData.ownedStore.status,
          type: userData.ownedStore.type,
          is_verified: userData.ownedStore.is_verified,
          business_email: userData.ownedStore.business_email,
          business_phone: userData.ownedStore.business_phone,
          business_address: userData.ownedStore.business_address,
          wallet_address: userData.ownedStore.wallet_address,
          hologram_label: userData.ownedStore.hologram_label
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/', auth(), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Store,
        as: 'ownedStore',
        required: false
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, email, username } = req.body;

    // Validate required fields
    const errors = {};
    if (!firstName?.trim()) errors.firstName = 'First name is required';
    if (!lastName?.trim()) errors.lastName = 'Last name is required';
    if (!username?.trim()) errors.username = 'Username is required';
    if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email format';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Update user fields
    if (firstName?.trim()) user.first_name = firstName.trim();
    if (lastName?.trim()) user.last_name = lastName.trim();
    if (email?.trim()) user.email = email.trim();
    if (username?.trim()) user.user_name = username.trim();

    await user.save();

    // Return updated user data
    const userData = user.toJSON();
    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.user_name,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        wallet_address: userData.wallet_address,
        lastLogin: userData.last_login,
        store: userData.ownedStore ? {
          id: userData.ownedStore.id,
          name: userData.ownedStore.name,
          status: userData.ownedStore.status,
          type: userData.ownedStore.type,
          is_verified: userData.ownedStore.is_verified,
          business_email: userData.ownedStore.business_email,
          business_phone: userData.ownedStore.business_phone,
          business_address: userData.ownedStore.business_address,
          wallet_address: userData.ownedStore.wallet_address,
          hologram_label: userData.ownedStore.hologram_label
        } : null
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;