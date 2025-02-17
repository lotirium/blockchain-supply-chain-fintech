import express from 'express';
import auth from '../middleware/auth.mjs';
import { User, Store } from '../models/index.mjs';

const router = express.Router();

const formatStoreData = (store) => ({
  id: store.id,
  name: store.name,
  description: store.description,
  status: store.status,
  type: store.type,
  is_verified: store.is_verified,
  verification_date: store.verification_date,
  business_email: store.business_email,
  business_phone: store.business_phone,
  business_address: store.business_address,
  wallet_address: store.wallet_address,
  rating: store.rating,
  total_sales: store.total_sales,
  total_products: store.total_products,
  total_orders: store.total_orders,
  shipping_policy: store.shipping_policy,
  return_policy: store.return_policy,
  hologram_label: store.hologram_label,
  logo: store.logo,
  banner: store.banner,
  created_at: store.created_at,
  updated_at: store.updated_at
});

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
        required: false
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
        role: userData.role,
        wallet_address: userData.wallet_address,
      username: userData.user_name,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role,
      walletAddress: userData.wallet_address,
      isEmailVerified: userData.is_email_verified,
        lastLogin: userData.last_login,
        store: userData.ownedStore ? formatStoreData(userData.ownedStore) : null
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
        required: false
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, email, username, store } = req.body;

    // Validate required fields
    const errors = {};
    if (!firstName?.trim()) errors.firstName = 'First name is required';
    if (!lastName?.trim()) errors.lastName = 'Last name is required';
    if (!username?.trim()) errors.username = 'Username is required';
    if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email format';

    // Validate store fields if provided
    if (store && user.role === 'seller') {
      if (!store.name?.trim()) errors.storeName = 'Store name is required';
      if (!store.phone?.trim()) errors.storePhone = 'Business phone is required';
      if (!store.address?.trim()) errors.storeAddress = 'Business address is required';
    }
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Update user fields
    if (firstName?.trim()) user.first_name = firstName.trim();
    if (lastName?.trim()) user.last_name = lastName.trim();
    if (email?.trim()) user.email = email.trim();
    if (username?.trim()) user.user_name = username.trim();

    // Update store if provided and user is a seller
    if (store && user.role === 'seller' && user.ownedStore) {
      if (store.name?.trim()) user.ownedStore.name = store.name.trim();
      if (store.description?.trim()) user.ownedStore.description = store.description.trim();
      if (store.phone?.trim()) user.ownedStore.business_phone = store.phone.trim();
      if (store.address?.trim()) user.ownedStore.business_address = store.address.trim();
      await user.ownedStore.save();
    }

    await user.save();

    // Fetch updated user with store data
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Store,
        as: 'ownedStore',
        required: false
      }]
    });

    const updatedUserData = updatedUser.toJSON();
    res.json({
      id: updatedUserData.id,
      email: updatedUserData.email,
      username: updatedUserData.user_name,
      firstName: updatedUserData.first_name,
      lastName: updatedUserData.last_name,
      role: updatedUserData.role,
      type: updatedUserData.type,
      walletAddress: updatedUserData.wallet_address,
      isEmailVerified: updatedUserData.is_email_verified,
      lastLogin: updatedUserData.last_login,
      createdAt: updatedUserData.created_at,
      updatedAt: updatedUserData.updated_at,
      store: updatedUserData.ownedStore ? formatStoreData(updatedUserData.ownedStore) : null
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;