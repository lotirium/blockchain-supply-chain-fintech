import QRCode from 'qrcode';
import crypto from 'crypto';
import { Order, Product, Store, User, OrderItem } from '../models/index.mjs';
import blockchainController from '../controllers/blockchain.mjs';
import { generateProductHologram } from '../services/imageService.mjs';

// Generate QR code and UV hologram for an order (called after order confirmation)
export const generateOrderLabels = async (req, res) => {
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

    // Generate UV hologram with NFT token ID and verification data
    const hologramPath = await generateProductHologram({
      productId: product.id,
      tokenId: product.token_id,
      productName: product.name,
      manufacturer: product.manufacturer,
      orderId: order.id,
      verificationCode,
      storeName: order.merchantStore.name,
      uvData: {
        tokenId: product.token_id,
        verificationCode,
        timestamp
      }
    });

    // Update product with hologram path
    await product.update({
      hologram_path: hologramPath,
      hologram_data: {
        generatedAt: timestamp,
        verificationCode,
        version: '1.0'
      }
    });

    // Update order with QR and hologram data
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
        hologramPath: hologramPath,
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
            id: productId
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

    // Get NFT data from blockchain if token exists
    let nftData = null;
    const product = order.items[0].product;
    
    if (product.token_id) {
      try {
        nftData = await blockchainController.getProduct(product.token_id);
      } catch (error) {
        console.warn('Failed to fetch NFT data:', error);
        // Continue without NFT data
      }
    }

    // Update verification statistics
    await order.update({
      qr_verification_count: (order.qr_verification_count || 0) + 1,
      qr_last_verified_at: new Date()
    });

    // Return verification result with order details and NFT data if available
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
            tokenId: product.token_id,
            blockchainStatus: product.blockchain_status || 'pending'
          },
          nftData: nftData || {
            status: 'pending',
            message: 'Product not yet minted on blockchain'
          },
          order: {
            id: order.id,
            status: order.status,
            purchaseDate: order.created_at,
            timeline: [
              { status: 'pending', time: order.created_at },
              ...(order.status !== 'pending' ? [{ status: 'confirmed', time: order.updated_at }] : []),
              ...(order.status === 'packed' || order.status === 'shipped' || order.status === 'delivered' ? [{ status: 'packed', time: order.updated_at }] : []),
              ...(order.status === 'shipped' || order.status === 'delivered' ? [{ status: 'shipped', time: order.updated_at }] : []),
              ...(order.status === 'delivered' ? [{ status: 'delivered', time: order.actual_delivery_date }] : [])
            ]
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
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'token_id', 'hologram_path']
        }]
      }],
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
        lastVerifiedAt: order.qr_last_verified_at,
        qrCode: order.qr_data?.qrCode,
        hologramPath: order.items?.[0]?.product?.hologram_path,
        tokenId: order.items?.[0]?.product?.token_id
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
  generateOrderLabels,
  verifyOrderQR,
  getOrderQRStatus
};