import { Store } from '../models/index.mjs';

export const isSeller = async (req, res, next) => {
  try {
    const user = req.user;

    // Check if user exists and has seller role
    if (!user || user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only sellers can access this resource.'
      });
    }

    // Check if the seller has an associated store
    const store = await Store.findOne({
      where: { 
        user_id: user.id,
        status: 'active'
      }
    });

    if (!store) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Seller must have an active store.'
      });
    }

    // Check store verification status
    if (!store.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Store must be verified.'
      });
    }

    // Add store to request object for use in route handlers
    req.store = store;
    next();
  } catch (error) {
    console.error('Error in isSeller middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while checking seller status'
    });
  }
};

export const isAdmin = (req, res, next) => {
  const user = req.user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};