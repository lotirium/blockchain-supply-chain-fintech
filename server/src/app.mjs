import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Queue from 'express-queue';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { testConnection } from './config/database.mjs';
import { syncDatabase, initializeDatabase } from './models/index.mjs';
import authRoutes from './routes/auth.mjs';
import profileRoutes from './routes/profile.mjs';
import blockchainRoutes from './routes/blockchain.mjs';
import storeRoutes from './routes/store.mjs';
import productRoutes from './routes/products.mjs';
import sellerDashboardRoutes from './routes/sellerDashboard.mjs';
import verificationRoutes from './routes/verification.mjs';
import { errorHandler } from './middleware/errorHandler.mjs';
import blockchainController from './controllers/blockchain.mjs';
import ipfsService from './services/ipfs.mjs';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();

// Configuration validation functions
const validateBlockchainConfig = () => {
  const requiredEnvVars = [
    'ETHEREUM_NODE_URL',
    'PRODUCT_NFT_ADDRESS',
    'SUPPLY_CHAIN_ADDRESS'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const validateIPFSConfig = () => {
  const requiredEnvVars = [
    'IPFS_GATEWAY_URL'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    console.error('Missing IPFS configuration:', missing);
    throw new Error(`Missing IPFS configuration: ${missing.join(', ')}`);
  }
};

const validateHologramConfig = () => {
  if (!process.env.HOLOGRAM_SECRET_KEY) {
    throw new Error('Missing HOLOGRAM_SECRET_KEY configuration');
  }
  if (process.env.HOLOGRAM_SECRET_KEY.length < 32) {
    throw new Error('HOLOGRAM_SECRET_KEY must be at least 32 characters long');
  }
};

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '..', 'uploads'),
  path.join(__dirname, '..', 'uploads', 'products')
];

await Promise.all(uploadDirs.map(dir => fs.mkdir(dir, { recursive: true })));

// Rate limiter configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'ERR_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 900 : 9000,
  message: {
    error: {
      message: 'Profile request rate limit exceeded, please try again later.',
      code: 'ERR_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 600 : 6000,
  message: {
    error: {
      message: 'Too many requests, please try again later.',
      code: 'ERR_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const blockchainLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 3000,
  message: {
    error: {
      message: 'Too many blockchain operations, please try again later.',
      code: 'ERR_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for verification endpoints (both seller status checks and admin operations)
const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 2000, // Balance between status checks and admin operations
  message: {
    error: {
      message: 'Too many verification requests, please try again later.',
      code: 'ERR_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const sellerDashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 600 : 6000,
  message: {
    error: {
      message: 'Too many dashboard requests, please try again later.',
      code: 'ERR_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure request queue
const queue = Queue({ activeLimit: 20, queuedLimit: -1 });

// Middleware Configuration

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : process.env.CORS_ORIGIN || 'http://127.0.0.1:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'Content-Disposition'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Requested-With',
    'Content-Disposition'
  ],
}));

// Increase server timeout
app.timeout = 120000; // 2 minutes

// Body parsing middleware with increased limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists with proper permissions
const uploadsDir = path.join(__dirname, '..', 'uploads');
const productsDir = path.join(uploadsDir, 'products');

try {
  await fs.mkdir(uploadsDir, { recursive: true, mode: 0o755 });
  await fs.mkdir(productsDir, { recursive: true, mode: 0o755 });
  console.log('Upload directories created successfully');
} catch (error) {
  console.error('Error creating upload directories:', error);
  throw error;
}

// Static file serving with proper headers for file uploads
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', (req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cache-Control': 'public, max-age=31536000',
  });
  next();
});

// Rate limiting middleware
app.use('/api/auth', authLimiter);
app.use('/api/profile', profileLimiter);
app.use('/api/blockchain', blockchainLimiter);
app.use('/api', apiLimiter);

// Queue middleware
app.use('/api', queue);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/seller/store', storeRoutes);
app.use('/api/verification', verificationLimiter, verificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller/dashboard', sellerDashboardLimiter, sellerDashboardRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Validate all configurations
    validateBlockchainConfig();
    validateIPFSConfig();
    validateHologramConfig();

    // Test database connection
    await testConnection();

    // Sync database models
    await syncDatabase(false);

    // Initialize database with default data
    await initializeDatabase();

    // Validate blockchain contracts
    await blockchainController.validateConfig();

    // Initialize IPFS service
    await ipfsService.validateConfig();

    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`API Server: http://127.0.0.1:${PORT}`);
      console.log(`File Server: http://127.0.0.1:${PORT}/uploads`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Start the application
initializeApp();