import express from 'express';
import auth from '../middleware/auth.mjs';
import { generateOrderQR, verifyOrderQR, getOrderQRStatus } from '../controllers/qrcode.mjs';

const router = express.Router();

// Generate QR code for an order (requires authentication)
router.post('/order/:orderId/generate', auth(), generateOrderQR);

// Verify a QR code (public endpoint)
router.post('/verify', verifyOrderQR);

// Get QR code status (requires authentication)
router.get('/order/:orderId/status', auth(), getOrderQRStatus);

export default router;