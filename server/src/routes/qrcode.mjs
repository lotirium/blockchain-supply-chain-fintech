import express from 'express';
import auth from '../middleware/auth.mjs';
import { generateOrderLabels, verifyOrderQR, getOrderQRStatus } from '../controllers/qrcode.mjs';

const router = express.Router();

// Generate QR code and UV hologram for an order (requires authentication)
router.post('/order/:orderId/generate-labels', auth(), generateOrderLabels);

// Verify a QR code (public endpoint)
router.post('/verify', verifyOrderQR);

// Get QR code status (requires authentication)
router.get('/order/:orderId/status', auth(), getOrderQRStatus);

export default router;