import { Store } from '../models/index.mjs';

export const isSeller = async (req, res, next) => {
  try {
    const user = req.user;

    // Check if user exists and has a seller role
    if (!user || (user.role !== 'manufacturer' && user.role !== 'retailer')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only sellers can access this resource.'
      });
    }

    // Check if the seller has an associated store
    const store = await Store.findOne({ owner: user._id });
    if (!store) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Seller must have an associated store.'
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