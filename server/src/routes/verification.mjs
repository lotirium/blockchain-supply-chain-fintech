import express from 'express';
import auth from '../middleware/auth.mjs';
import {
  getPendingVerifications,
  updateVerificationStatus,
  getVerificationStatus,
  getCustomers,
  verifyCustomerEmail
} from '../controllers/verification.mjs';

const router = express.Router();

// Get verification status (seller only)
router.get('/status', auth(['seller']), getVerificationStatus);

// Admin routes
router.get('/pending', auth(['admin']), getPendingVerifications);
router.patch('/:storeId/status', auth(['admin']), updateVerificationStatus);

// Customer management routes
router.get('/customers', auth(['admin']), getCustomers);
router.post('/customers/:userId/verify-email', auth(['admin']), verifyCustomerEmail);

export default router;