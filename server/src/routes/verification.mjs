import express from 'express';
import {
  getVerificationStatus,
  updateVerificationStatus,
  getPendingVerifications,
  getCustomers,
  verifyCustomerEmail
} from '../controllers/verification.mjs';
import auth from '../middleware/auth.mjs';
import { requireAdmin } from '../middleware/auth.mjs';

const router = express.Router();

// Seller routes
router.get('/status', auth(), getVerificationStatus);

// Admin routes
router.get('/pending', requireAdmin, getPendingVerifications);
router.put('/:storeId/status', requireAdmin, updateVerificationStatus);

// Customer management routes
router.get('/customers', requireAdmin, getCustomers);
router.post('/customers/:userId/verify', requireAdmin, verifyCustomerEmail);

export default router;