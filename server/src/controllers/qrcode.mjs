import QRCode from 'qrcode';
import crypto from 'crypto';
import { Order, Product, Store, User, OrderItem } from '../models/index.mjs';
import blockchainController from '../controllers/blockchain.mjs';

// Generate QR code for an order (called after order confirmation)
export const generateOrderQR = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find the order and verify seller ownership
    const order = await Order.findOne({
      where: {
        id: orderId,
        store_id: req.user.ownedStore?.id, // Use optional chaining to handle null case
        status: ['confirmed', 'packed'] // Only allow QR generation for confirmed or packed orders
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'token_id', 'manufacturer']
        }]
      }, {
        model: Store,
        as: 'merchantStore',
        attributes: ['id', 'name']
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    if (!req.user.ownedStore) {
      return res.status(403).json({
        success: false,
        message: 'Seller access required'
      });
    }

    // Ensure there are items in the order
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items'
      });
    }

    // Get the first item for QR code
    const firstItem = order.items[0];
    const product = firstItem.product;

    // Generate a unique verification code
    const verificationCode = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();

    // Create QR code data with order and NFT information
    const qrData = JSON.stringify({
      o: order.id, // Order ID
      p: product.id, // Product ID
      t: product.token_id, // NFT Token ID
      v: verificationCode, // Verification code
      ts: timestamp // Timestamp
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      width: 500,
      margin: 2
    });

    // Update order with QR data
    await order.update({
      qr_data: {
        verificationCode,
        generatedAt: timestamp,
        version: '1.0'
      },
      qr_status: 'active'
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        orderId: order.id,
        status: 'active',
        generatedAt: timestamp,
        orderInfo: {
          orderNumber: order.id.slice(0, 8),
          productName: product.name,
          storeName: order.merchantStore.name
        }
      }
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    let errorMessage = 'Failed to generate QR code';
    let statusCode = 500;

    if (error.code === 'ENOENT') {
      errorMessage = 'QR code generation service unavailable';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.name === 'SequelizeError') {
      errorMessage = 'Database error while generating QR code';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify a product's QR code (public endpoint)
export const verifyOrderQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    // Parse QR data
    const data = JSON.parse(qrData);
    const { o: orderId, p: productId, t: tokenId, v: verificationCode, ts: timestamp } = data;

    // Find the order
    const order = await Order.findOne({
      where: {
        id: orderId,
        qr_status: 'active'
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          where: {
            id: productId,
            token_id: tokenId
          }
        }]
      }, {
        model: Store,
        as: 'merchantStore',
        attributes: ['id', 'name']
      }, {
        model: User,
        as: 'orderPlacer',
        attributes: ['id', 'user_name']
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or QR code inactive'
      });
    }

    // Verify the code matches
    if (!order.qr_data?.verificationCode === verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Get NFT data from blockchain
    const nftData = await blockchainController.getProduct(tokenId);

    // Update verification statistics
    await order.update({
      qr_verification_count: (order.qr_verification_count || 0) + 1,
      qr_last_verified_at: new Date()
    });

    const product = order.items[0].product;

    // Return verification result with order and NFT details
    res.json({
      success: true,
      data: {
        verificationResult: {
          isAuthentic: true,
          verifiedAt: new Date().toISOString(),
          purchaseDate: order.created_at,
          store: order.merchantStore.name,
          product: {
            name: product.name,
            manufacturer: product.manufacturer,
            tokenId: product.token_id
          },
          nftData,
          order: {
            id: order.id,
            status: order.status,
            purchaseDate: order.created_at,
            deliveryDate: order.actual_delivery_date
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to verify QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify QR code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get QR code status and verification history (requires authentication)
export const getOrderQRStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Ensure user has access to this order
    const order = await Order.findOne({
      where: {
        id: orderId,
        ...(req.user.role === 'seller' ? { store_id: req.user.ownedStore?.id } : { user_id: req.user.id })
      },
      attributes: [
        'id',
        'qr_status',
        'qr_verification_count',
        'qr_last_verified_at'
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        qrStatus: order.qr_status,
        verificationCount: order.qr_verification_count,
        lastVerifiedAt: order.qr_last_verified_at
      }
    });
  } catch (error) {
    console.error('Failed to get QR status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get QR status'
    });
  }
};

export default {
  generateOrderQR,
  verifyOrderQR,
  getOrderQRStatus
};