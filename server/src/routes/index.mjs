import express from 'express';
import authRoutes from './auth.mjs';
import sellerDashboardRoutes from './sellerDashboard.mjs';
import productRoutes from './products.mjs';
import orderRoutes from './orders.mjs';
import blockchainRoutes from './blockchain.mjs';
import { errorHandler } from '../middleware/errorHandler.mjs';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
router.use('/api/auth', authRoutes);
router.use('/api/seller/dashboard', sellerDashboardRoutes);
router.use('/api/products', productRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/blockchain', blockchainRoutes);

// Error handling
router.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

router.use(errorHandler);

export default router;