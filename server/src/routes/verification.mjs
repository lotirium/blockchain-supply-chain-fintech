import express from 'express';
import { 
  getVerificationStatus, 
  updateVerificationStatus, 
  getPendingVerifications 
} from '../controllers/verification.mjs';
import auth from '../middleware/auth.mjs';
import { requireAdmin } from '../middleware/auth.mjs';

const router = express.Router();

// Seller routes
router.get('/status', auth(), getVerificationStatus);

// Admin routes
router.get('/pending', requireAdmin, getPendingVerifications);
router.put('/:storeId/status', requireAdmin, updateVerificationStatus);

export default router;