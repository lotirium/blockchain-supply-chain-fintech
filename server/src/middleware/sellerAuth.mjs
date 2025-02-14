import { Store } from '../models/index.mjs';

/**
 * Middleware to verify that the authenticated user is a seller
 * and has an active store.
 */
const sellerAuth = async (req, res, next) => {
  try {
    // Check if user exists and has seller role
    if (!req.user || req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Seller privileges required.'
      });
    }

    // Get store information
    const store = await Store.findOne({
      where: {
        user_id: req.user.id
      },
      attributes: ['id', 'status', 'is_verified', 'wallet_address']
    });

    if (!store) {
      return res.status(403).json({
        success: false,
        message: 'No store found for this seller.'
      });
    }

    // Check store status
    if (store.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Store is currently suspended. Please contact support.'
      });
    }

    // Check if store is verified for blockchain operations
    if (!store.is_verified && req.path.includes('/blockchain')) {
      return res.status(403).json({
        success: false,
        message: 'Store is not verified for blockchain operations.'
      });
    }

    // Add store to request object for use in controllers
    req.store = store;

    if (req.path.includes('/retailer') && store.type !== 'retailer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Retailer privileges required.'
      });
    }

    // If pending verification, only allow access to specific endpoints
    if (store.status === 'pending_verification') {
      const allowedPaths = [
        '/dashboard/data',
        '/dashboard/profile',
        '/dashboard/notifications'
      ];

      if (!allowedPaths.some(path => req.path.includes(path))) {
        return res.status(403).json({
          success: false,
          message: 'Store verification pending. Limited access available.'
        });
      }
    }

    // Check wallet address for blockchain operations
    if (req.path.includes('/blockchain') && !store.wallet_address) {
      return res.status(403).json({
        success: false,
        message: 'Blockchain wallet not found. Please contact support.'
      });
    }

    // Log access attempt for security monitoring
    console.log('Seller access:', {
      userId: req.user.id,
      storeId: store.id,
      storeType: store.type,
      path: req.path,
      method: req.method,
      timestamp: new Date()
    });

    next();
  } catch (error) {
    console.error('Seller authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

export default sellerAuth;