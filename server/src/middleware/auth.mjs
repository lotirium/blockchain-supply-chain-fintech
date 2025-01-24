import jwt from 'jsonwebtoken';
import { User } from '../models/index.mjs';

const auth = (roles = []) => {
  // Convert string to array if single role
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return async (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is active
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Account suspended' });
      }

      // Check role if specified
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      console.error('Auth middleware error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  };
};

// Helper middleware for specific roles
export const requireRole = (role) => auth(role);
export const requireSeller = auth('seller');
export const requireAdmin = auth('admin');

export default auth;