import { ethers } from 'ethers';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Op } from 'sequelize';
import User from '../models/User.mjs';
import Store from '../models/Store.mjs';
import Product from '../models/Product.mjs';
import ipfsService from '../services/ipfs.mjs';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
}).array('images', 5); // Allow up to 5 images

class BlockchainController {
  constructor() {
    // Initialize provider with your Ethereum node URL
    const nodeUrl = process.env.ETHEREUM_NODE_URL || 'http://127.0.0.1:8545';
    this.provider = new ethers.JsonRpcProvider(nodeUrl);
    
    // Initialize admin wallet
    if (!process.env.ADMIN_PRIVATE_KEY) {
      throw new Error('ADMIN_PRIVATE_KEY not configured');
    }
    this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
    
    // Store contract addresses
    this.addresses = {
      productNFT: process.env.PRODUCT_NFT_ADDRESS,
      supplyChain: process.env.SUPPLY_CHAIN_ADDRESS
    };

    // Initialize contract instances as null (lazy loading)
    this._productNFT = null;
    this._supplyChain = null;

    // Initialize hologram secret key
    this.hologramKey = process.env.HOLOGRAM_SECRET_KEY;

    // Verify admin wallet initialization
    this.initializeAdminWallet().catch(error => {
      console.error('Failed to initialize admin wallet:', error);
      throw error;
    });
  }

  async initializeAdminWallet() {
    try {
      const supplyChain = await this.getSupplyChain();
      const DEFAULT_ADMIN_ROLE = await supplyChain.DEFAULT_ADMIN_ROLE();
      
      // Verify admin has DEFAULT_ADMIN_ROLE
      const hasAdminRole = await supplyChain.hasRole(DEFAULT_ADMIN_ROLE, this.adminWallet.address);
      
      if (!hasAdminRole) {
        console.log('Admin wallet does not have DEFAULT_ADMIN_ROLE, attempting to grant...');
        
        // Use the deployer's private key (first Hardhat account) to grant admin role
        const deployerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        const deployerWallet = new ethers.Wallet(deployerPrivateKey, this.provider);
        const supplyChainWithDeployer = supplyChain.connect(deployerWallet);
        
        // Grant admin role to our admin wallet
        const tx = await supplyChainWithDeployer.grantRole(DEFAULT_ADMIN_ROLE, this.adminWallet.address);
        await tx.wait();
        
        // Verify role was granted
        const roleGranted = await supplyChain.hasRole(DEFAULT_ADMIN_ROLE, this.adminWallet.address);
        if (!roleGranted) {
          throw new Error('Failed to grant DEFAULT_ADMIN_ROLE to admin wallet');
        }
        
        console.log('Successfully granted DEFAULT_ADMIN_ROLE to admin wallet');
      }

      console.log('Admin wallet initialized successfully:', {
        address: this.adminWallet.address,
        hasAdminRole: true
      });
    } catch (error) {
      console.error('Admin wallet initialization failed:', error);
      throw new Error('Failed to initialize admin wallet with proper permissions');
    }
  }

  // Contract Management Methods

  async getProductNFT() {
    if (!this._productNFT) {
      if (!this.addresses.productNFT) {
        throw new Error('ProductNFT contract address not configured');
      }

      try {
        const ProductNFT = await import('../contracts/ProductNFT.json', { assert: { type: 'json' } });
        this._productNFT = new ethers.Contract(
          this.addresses.productNFT,
          ProductNFT.default.abi,
          this.provider
        );
      } catch (error) {
        console.error('Failed to load ProductNFT contract:', error);
        throw new Error('Failed to initialize ProductNFT contract');
      }
    }
    return this._productNFT;
  }

  async getSupplyChain() {
    if (!this._supplyChain) {
      if (!this.addresses.supplyChain) {
        throw new Error('SupplyChain contract address not configured');
      }

      try {
        const SupplyChain = await import('../contracts/SupplyChain.json', { assert: { type: 'json' } });
        this._supplyChain = new ethers.Contract(
          this.addresses.supplyChain,
          SupplyChain.default.abi,
          this.provider
        );
      } catch (error) {
        console.error('Failed to load SupplyChain contract:', error);
        throw new Error('Failed to initialize SupplyChain contract');
      }
    }
    return this._supplyChain;
  }

  // User Wallet Management
  async getUserSigner(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.wallet_address) {
      throw new Error('User wallet not found');
    }

    // Get user's private key
    const privateKey = await user.getDecryptedPrivateKey();
    if (!privateKey) {
      throw new Error('Failed to decrypt user wallet private key');
    }

    // Create wallet instance with user's private key
    const wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Verify wallet address matches user's stored address
    if (wallet.address.toLowerCase() !== user.wallet_address.toLowerCase()) {
      console.error('Wallet address mismatch:', {
        expected: user.wallet_address.toLowerCase(),
        actual: wallet.address.toLowerCase()
      });
      throw new Error('Wallet address mismatch');
    }

    console.log('Successfully created user wallet:', wallet.address);
    return wallet;
  }

  // Role Management Methods
  async grantSellerRole(userId, maxRetries = 3) {
    const TIMEOUT = 30000; // 30 seconds timeout
    const RETRY_DELAY = 5000; // 5 seconds between retries

    const attemptRoleGrant = async (attempt = 0) => {
      try {
        const user = await User.findByPk(userId, {
          include: [{
            model: Store,
            as: 'ownedStore',
            required: true
          }]
        });

        if (!user || !user.wallet_address) {
          throw new Error('User or wallet not found');
        }

        if (!user.ownedStore || !user.ownedStore.type) {
          throw new Error('Store type not found');
        }

        const supplyChain = await this.getSupplyChain();
        const supplyChainWithSigner = supplyChain.connect(this.adminWallet);
        
        // Get role constants from contract
        const [MANUFACTURER_ROLE, RETAILER_ROLE] = await Promise.all([
          supplyChain.MANUFACTURER_ROLE(),
          supplyChain.RETAILER_ROLE()
        ]);

        // Determine which role to check and grant based on store type
        let roleToCheck;
        let hasRole = false;
        let tx;

        console.log('Attempting role grant:', {
          userId,
          storeType: user.ownedStore.type,
          walletAddress: user.wallet_address,
          attempt: attempt + 1,
          maxRetries
        });

        // Add timeout to blockchain operations
        const roleCheckPromise = (async () => {
          switch (user.ownedStore.type) {
            case 'manufacturer':
              roleToCheck = MANUFACTURER_ROLE;
              return await supplyChain.hasRole(MANUFACTURER_ROLE, user.wallet_address);
            case 'retailer':
              roleToCheck = RETAILER_ROLE;
              return await supplyChain.hasRole(RETAILER_ROLE, user.wallet_address);
            default:
              throw new Error('Invalid store type: Must be manufacturer or retailer');
          }
        })();

        hasRole = await Promise.race([
          roleCheckPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Role check timeout')), TIMEOUT)
          )
        ]);

        if (hasRole) {
          return { success: true, status: 'already_granted' };
        }

        // Grant role with timeout
        const grantRolePromise = (async () => {
          return await supplyChainWithSigner.grantRole(roleToCheck, user.wallet_address);
        })();

        tx = await Promise.race([
          grantRolePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Role grant timeout')), TIMEOUT)
          )
        ]);

        // Wait for transaction with timeout
        await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), TIMEOUT)
          )
        ]);

        // Verify role was granted with timeout
        const verifyRolePromise = (async () => {
          return await supplyChain.hasRole(roleToCheck, user.wallet_address);
        })();

        const roleGranted = await Promise.race([
          verifyRolePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Role verification timeout')), TIMEOUT)
          )
        ]);

        if (!roleGranted) {
          throw new Error('Role verification failed');
        }

        // Update store status and blockchain verification
        await user.ownedStore.update({
          status: 'active',
          blockchain_verification_date: new Date(),
          wallet_address: user.wallet_address
        });

        return { success: true, status: 'granted', txHash: tx.hash };
      } catch (error) {
        console.error('Role grant attempt failed:', {
          attempt: attempt + 1,
          error: error.message
        });

        if (attempt < maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return attemptRoleGrant(attempt + 1);
        }

        // Categorize final error
        if (error.message.includes('wallet')) {
          throw new Error('Failed to grant seller role: Wallet setup issue - ' + error.message);
        } else if (error.message.includes('timeout')) {
          throw new Error('Failed to grant seller role: Transaction timeout - please try again');
        } else if (error.message.includes('verification failed')) {
          throw new Error('Failed to grant seller role: Role verification failed - please check blockchain status');
        }
        
        throw new Error('Failed to grant seller role: ' + error.message);
      }
    };

    try {
      return await attemptRoleGrant();
    } catch (error) {
      console.error('All role grant attempts failed:', error);
      throw error;
    }
  }

  // Image Management Methods

  async handleImageUpload(req) {
    return new Promise((resolve, reject) => {
      upload(req, null, async (err) => {
        if (err) {
          return reject(err);
        }

        try {
          const files = req.files;
          const ipfsResults = await ipfsService.uploadFiles(files);
          resolve(ipfsResults);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async updateNFTMetadata(tokenId, metadata) {
    try {
      const signer = await this.getUserSigner(metadata.userId);
      const productNFT = await this.getProductNFT();
      const productNFTWithSigner = productNFT.connect(signer);

      // Upload metadata to IPFS
      const ipfsResult = await ipfsService.uploadContent(JSON.stringify(metadata));
      const tokenURI = ipfsResult.url;

      const tx = await productNFTWithSigner.setTokenURI(tokenId, tokenURI);
      await tx.wait();

      return {
        success: true,
        transaction: tx.hash,
        tokenURI
      };
    } catch (error) {
      console.error('Failed to update NFT metadata:', error);
      throw new Error('Failed to update NFT metadata');
    }
  }

  // Product Management Methods



  async createProduct(userId, name, manufacturer, price, description) {
    try {
      // Get user with store and verify access
      const user = await User.findByPk(userId, {
        include: [{
          model: Store,
          as: 'ownedStore',
          required: true,
          where: {
            status: 'active',
            is_verified: true
          }
        }]
      });
      if (!user || !user.wallet_address || !user.ownedStore) {
        throw new Error('User not found or not authorized');
      }

      if (!user.ownedStore.wallet_address || user.ownedStore.wallet_address !== user.wallet_address) {
        throw new Error('Store wallet mismatch');
      }

      console.log('Starting product creation for user:', {
        userId,
        walletAddress: user.wallet_address,
        storeType: user.ownedStore.type
      });

      // Get contract
      const supplyChain = await this.getSupplyChain();

      console.log('Checking user roles:', {
        userAddress: user.wallet_address,
        storeType: user.ownedStore.type
      });

      // Get role constants from contract
      const [MANUFACTURER_ROLE, RETAILER_ROLE] = await Promise.all([
        supplyChain.MANUFACTURER_ROLE(),
        supplyChain.RETAILER_ROLE()
      ]);

      // Verify user has appropriate role for product creation
      let hasRequiredRole = false;
      let roleToCheck;
      switch (user.ownedStore.type) {
        case 'manufacturer':
          roleToCheck = MANUFACTURER_ROLE;
          hasRequiredRole = await supplyChain.hasRole(MANUFACTURER_ROLE, user.wallet_address);
          break;
        case 'retailer':
          roleToCheck = RETAILER_ROLE;
          hasRequiredRole = await supplyChain.hasRole(RETAILER_ROLE, user.wallet_address);
          break;
        default:
          throw new Error(`Invalid store type for product creation: ${user.ownedStore.type}`);
      }

      console.log('Role verification:', {
        userAddress: user.wallet_address,
        storeType: user.ownedStore.type,
        hasRequiredRole
      });

      // If user doesn't have required role, attempt to grant it
      if (!hasRequiredRole) {
        console.log(`Attempting to grant ${user.ownedStore.type} role to user:`, user.wallet_address);
        
        try {
          const roleGrantResult = await this.grantSellerRole(userId);
          if (!roleGrantResult.success) {
            throw new Error(`Failed to grant ${user.ownedStore.type} role`);
          }

          console.log(`Successfully granted ${user.ownedStore.type} role:`, roleGrantResult);

          // Verify role was granted
          hasRequiredRole = await supplyChain.hasRole(roleToCheck, user.wallet_address);

          if (!hasRequiredRole) {
            throw new Error('Role verification failed after granting');
          }
        } catch (error) {
          console.error(`Failed to grant ${user.ownedStore.type} role:`, error);
          throw new Error(`Failed to grant ${user.ownedStore.type} role: ${error.message}`);
        }
      } else {
        console.log('User already has required role:', {
          storeType: user.ownedStore.type,
          hasRequiredRole
        });
      }

      // Get user's wallet and connect to contract
      const wallet = await this.getUserSigner(userId);
      console.log('Using wallet for product creation:', {
        address: wallet.address,
        matches: wallet.address.toLowerCase() === user.wallet_address.toLowerCase()
      });
      
      const supplyChainWithSigner = supplyChain.connect(wallet);

      // Create and upload metadata
      const metadata = {
        name,
        description,
        manufacturer,
        price: price.toString(),
        timestamp: Date.now(),
        attributes: []
      };

      // Upload metadata to IPFS
      const ipfsResult = await ipfsService.uploadContent(JSON.stringify(metadata));
      const tokenURI = ipfsResult.url;

      // Create product through SupplyChain contract
      console.log('Creating product with wallet:', wallet.address);
      const tx = await supplyChainWithSigner.createProduct(
        name,
        manufacturer,
        price,
        tokenURI
      );
      
      const receipt = await tx.wait();

      // Get product ID from event
      const event = receipt.events.find(e => e.event === 'ProductCreated');
      const productId = event.args.productId;
      const eventManufacturer = event.args.manufacturer;
      const eventName = event.args.name;

      // Create product record
      await Product.create({
        tokenId: productId.toString(), // Keep using tokenId in DB for compatibility
        name: eventName,
        manufacturer: eventManufacturer,
        price,
        description,
        status: 'active',
        userId
      });

      return {
        productId: productId.toString(),
        manufacturer: eventManufacturer,
        name: eventName,
        transaction: tx.hash,
        tokenURI
      };
    } catch (error) {
      console.error('Failed to create product:', error);
      if (error.message.includes('manufacturer role')) {
        throw new Error(error.message);
      }
      if (error.message.includes('wallet')) {
        throw new Error('Failed to create product: Wallet setup issue - ' + error.message);
      }
      throw new Error('Failed to create product: ' + error.message);
    }
  }

  async getProduct(tokenId) {
    try {
      const [productNFT, supplyChain] = await Promise.all([
        this.getProductNFT(),
        this.getSupplyChain()
      ]);

      const [product, shipment] = await Promise.all([
        productNFT.getProduct(tokenId),
        supplyChain.getCurrentShipment(tokenId)
      ]);

      // Get product from database for additional details
      const dbProduct = await Product.findOne({
        where: { tokenId: tokenId.toString() }
      });

      return {
        name: product.name,
        manufacturer: product.manufacturer,
        currentOwner: product.currentOwner,
        manufactureDate: product.manufactureDate.toString(),
        status: product.status,
        shipmentStage: shipment.stage,
        shipmentLocation: shipment.location,
        hologramData: dbProduct?.hologramData ? JSON.parse(dbProduct.hologramData) : null,
        images: dbProduct?.images || [],
        attributes: dbProduct?.attributes || []
      };
    } catch (error) {
      console.error('Failed to get product:', error);
      throw new Error('Failed to get product details');
    }
  }

  async updateProductStatus(userId, tokenId, newStatus) {
    try {
      const signer = await this.getUserSigner(userId);
      const productNFT = await this.getProductNFT();
      const productNFTWithSigner = productNFT.connect(signer);

      const tx = await productNFTWithSigner.updateProductStatus(tokenId, newStatus);
      const receipt = await tx.wait();

      // Update status in database
      await Product.update(
        { status: newStatus },
        { where: { tokenId: tokenId.toString() } }
      );

      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to update product status:', error);
      throw new Error('Failed to update product status');
    }
  }

  // Supply Chain Methods

  async updateShipmentStatus(userId, tokenId, stage, location) {
    try {
      const signer = await this.getUserSigner(userId);
      const supplyChain = await this.getSupplyChain();
      const supplyChainWithSigner = supplyChain.connect(signer);

      const tx = await supplyChainWithSigner.updateStage(tokenId, stage);
      await tx.wait();

      if (location) {
        const locationTx = await supplyChainWithSigner.updateLocation(tokenId, location);
        await locationTx.wait();
      }

      // Update shipment status in database
      await Product.update(
        {
          shipmentStage: stage,
          shipmentLocation: location
        },
        { where: { tokenId: tokenId.toString() } }
      );

      return tx.hash;
    } catch (error) {
      console.error('Failed to update shipment status:', error);
      throw new Error('Failed to update shipment status');
    }
  }

  // Hologram Methods

  async generateHologram(tokenId, productData) {
    try {
      const product = await Product.findOne({ where: { tokenId } });
      if (!product) {
        throw new Error('Product not found');
      }

      // Generate unique hologram ID
      const hologramId = crypto.randomBytes(16).toString('hex');

      // Create hologram data
      const hologramData = {
        id: hologramId,
        tokenId,
        productId: product.id,
        timestamp: Date.now(),
        attributes: productData.attributes || []
      };

      // Sign hologram data
      const message = JSON.stringify(hologramData);
      const signature = crypto
        .createHmac('sha256', this.hologramKey)
        .update(message)
        .digest('hex');

      hologramData.signature = signature;

      // Store hologram data in product
      await product.update({
        hologramData: JSON.stringify(hologramData)
      });

      return hologramData;
    } catch (error) {
      console.error('Failed to generate hologram:', error);
      throw new Error('Failed to generate hologram');
    }
  }

  async verifyHologram(hologramId) {
    try {
      const product = await Product.findOne({
        where: {
          hologramData: {
            [Op.like]: `%"id":"${hologramId}"%`
          }
        }
      });

      if (!product) {
        return { valid: false, reason: 'Hologram not found' };
      }

      const hologramData = JSON.parse(product.hologramData);
      const { signature, ...dataToVerify } = hologramData;

      // Verify signature
      const message = JSON.stringify(dataToVerify);
      const expectedSignature = crypto
        .createHmac('sha256', this.hologramKey)
        .update(message)
        .digest('hex');

      return {
        valid: signature === expectedSignature,
        productData: dataToVerify
      };
    } catch (error) {
      console.error('Failed to verify hologram:', error);
      throw new Error('Failed to verify hologram');
    }
  }

  // Configuration Validation

  async validateConfig() {
    const missingConfig = [];
    
    if (!process.env.ETHEREUM_NODE_URL) {
      missingConfig.push('ETHEREUM_NODE_URL');
    }
    if (!this.addresses.productNFT) {
      missingConfig.push('PRODUCT_NFT_ADDRESS');
    }
    if (!this.addresses.supplyChain) {
      missingConfig.push('SUPPLY_CHAIN_ADDRESS');
    }
    if (!this.hologramKey) {
      missingConfig.push('HOLOGRAM_SECRET_KEY');
    }

    if (missingConfig.length > 0) {
      throw new Error(`Missing required configuration: ${missingConfig.join(', ')}`);
    }

    // Test contract loading
    try {
      await this.getProductNFT();
      await this.getSupplyChain();
    } catch (error) {
      throw new Error('Failed to load contract artifacts');
    }

    return true;
  }
}

// Create singleton instance
const blockchainController = new BlockchainController();
export default blockchainController;