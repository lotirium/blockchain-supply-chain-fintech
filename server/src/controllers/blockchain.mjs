import { ethers } from 'ethers';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import User from '../models/User.mjs';
import Store from '../models/Store.mjs';
import Product from '../models/Product.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Contract artifacts will be loaded during initialization
let ProductNFT;
let SupplyChain;

class BlockchainController {
    constructor() {
        // Initialize provider with local network
        const nodeUrl = process.env.ETHEREUM_NODE_URL || 'http://127.0.0.1:8545';
        this.provider = new ethers.JsonRpcProvider(nodeUrl);
        
        // Contract addresses
        this.addresses = {
            productNFT: process.env.PRODUCT_NFT_ADDRESS,
            supplyChain: process.env.SUPPLY_CHAIN_ADDRESS
        };

        // Initialize contract instances
        this._productNFT = null;
        this._supplyChain = null;

        // Event subscribers
        this.eventSubscribers = new Set();

        // Initialize state
        this.initialized = null;
    }

    async loadArtifacts() {
        console.log('Initializing contract artifacts...');
        
        ProductNFT = {
            abi: (await import('../contracts/ProductNFT.json', { assert: { type: 'json' } })).default.abi
        };
        
        SupplyChain = {
            abi: (await import('../contracts/SupplyChain.json', { assert: { type: 'json' } })).default.abi
        };

        if (!ProductNFT?.abi || !SupplyChain?.abi) {
            throw new Error('Contract artifacts are missing ABI');
        }

        console.log('Contract artifacts loaded successfully');
    }

    async testConnection(timeout = 2000) {
        console.log('Testing provider connection...');
        const network = await Promise.race([
            this.provider.getNetwork(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Network connection timeout')), timeout)
            )
        ]);
        
        console.log('Connected to network:', {
            name: network.name,
            chainId: network.chainId
        });
        return network;
    }

    async checkContracts() {
        if (!ProductNFT?.abi || !SupplyChain?.abi) {
            throw new Error('Contract artifacts missing or invalid');
        }

        // Create temporary contract instances just to verify they're accessible
        const productNFT = new ethers.Contract(
            this.addresses.productNFT,
            ProductNFT.abi,
            this.provider
        );
        const supplyChain = new ethers.Contract(
            this.addresses.supplyChain,
            SupplyChain.abi,
            this.provider
        );

        // Test basic contract access
        await Promise.all([
            productNFT.address,
            supplyChain.address
        ]);
        console.log('Contract instances verified successfully');
    }

    async initialize() {
        const TIMEOUT = 2000; // 30 seconds timeout
        
        // Prevent multiple initialization attempts
        if (this.initialized) {
            await this.initialized;
            return;
        }

        try {
            console.log('Starting blockchain controller initialization...');
            
            // Create initialization promise
            const initPromise = async () => {
                await this.loadArtifacts();
                await this.testConnection(TIMEOUT);
                await this.checkContracts();

                if (!this._skipEventListeners) {
                    console.log('Starting blockchain event listeners...');
                    try {
                        await Promise.race([
                            this.startEventListeners(),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Event listener setup timeout')), TIMEOUT)
                            )
                        ]);
                        console.log('Event listeners initialized successfully');
                    } catch (error) {
                        console.warn('Failed to initialize event listeners:', error);
                        // Don't fail initialization if event listeners fail
                    }
                } else {
                    console.log('Skipping event listener setup (validation mode)');
                }

                console.log('Blockchain controller initialization completed successfully');
            };

            // Execute initialization with timeout
            await Promise.race([
                initPromise(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Initialization timeout')), TIMEOUT)
                )
            ]);
        } catch (error) {
            console.error('Blockchain controller initialization failed:', error);
            
            // Specific error handling for different scenarios
            if (error.message.includes('Network connection timeout')) {
                console.error('Network connection timed out. Please check if the Ethereum node is running at:', process.env.ETHEREUM_NODE_URL);
                throw new Error(`Network connection failed: Unable to connect to Ethereum node at ${process.env.ETHEREUM_NODE_URL}`);
            }
            
            if (error.message.includes('Initialization timeout')) {
                console.error('Initialization process timed out. This might indicate network issues or high latency.');
                throw new Error('Blockchain initialization timed out - please check network connectivity');
            }

            if (error.code === 'ECONNREFUSED') {
                console.error('Connection refused. Please check if the Ethereum node is running and accessible.');
                throw new Error(`Connection refused to Ethereum node at ${process.env.ETHEREUM_NODE_URL}`);
            }

            throw error;
        }
    }

    // Ensure initialization
    async ensureInitialized() {
        try {
            console.log('Checking blockchain controller initialization...');
            
            if (this.initialized) {
                console.log('Using existing initialization');
                return await this.initialized;
            }

            // Start new initialization with lock to prevent race conditions
            console.log('Starting new initialization');
            
            // Create a new initialization promise
            const initPromise = (async () => {
                try {
                    await this.initialize();
                    return true;
                } catch (error) {
                    this.initialized = null;
                    throw error;
                }
            })();

            // Set the promise before awaiting to prevent race conditions
            this.initialized = initPromise;

            // Wait for initialization
            await initPromise;
            
            console.log('Initialization check completed successfully');
        } catch (error) {
            this.initialized = null;
            console.error('Blockchain controller not properly initialized:', error);
            throw new Error(`Blockchain controller not properly initialized: ${error.message}`);
        }
    }

    // Network Status
    async getNetworkStatus() {
        try {
            await this.ensureInitialized();
            
            const [network, blockNumber, gasPrice] = await Promise.all([
                this.provider.getNetwork(),
                this.provider.getBlockNumber(),
                this.provider.getGasPrice()
            ]);

            return {
                name: network.name,
                chainId: network.chainId,
                blockNumber: blockNumber.toString(),
                gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
                isConnected: true
            };
        } catch (error) {
            console.error('Failed to get network status:', error);
            return {
                isConnected: false,
                error: error.message
            };
        }
    }

    // Contract Management
    async getProductNFT() {
        try {
            await this.ensureInitialized();
            if (!this._productNFT) {
                if (!this.addresses.productNFT) {
                    throw new Error('ProductNFT contract address not configured');
                }
                if (!ProductNFT?.abi) {
                    throw new Error('ProductNFT contract artifact not loaded properly');
                }
                this._productNFT = new ethers.Contract(
                    this.addresses.productNFT,
                    ProductNFT.abi,
                    this.provider
                );
                console.log('ProductNFT contract initialized:', this.addresses.productNFT);
            }
            return this._productNFT;
        } catch (error) {
            console.error('Failed to get ProductNFT contract:', error);
            throw new Error(`Failed to get ProductNFT contract: ${error.message}`);
        }
    }

    async getSupplyChain() {
        try {
            await this.ensureInitialized();
            if (!this._supplyChain) {
                if (!this.addresses.supplyChain) {
                    throw new Error('SupplyChain contract address not configured');
                }
                if (!SupplyChain?.abi) {
                    throw new Error('SupplyChain contract artifact not loaded properly');
                }
                this._supplyChain = new ethers.Contract(
                    this.addresses.supplyChain,
                    SupplyChain.abi,
                    this.provider
                );
                console.log('SupplyChain contract initialized:', this.addresses.supplyChain);
            }
            return this._supplyChain;
        } catch (error) {
            console.error('Failed to get SupplyChain contract:', error);
            throw new Error(`Failed to get SupplyChain contract: ${error.message}`);
        }
    }

    // Role Management
    async grantManufacturerRole(address) {
        const supplyChain = await this.getSupplyChain();
        const MANUFACTURER_ROLE = await supplyChain.MANUFACTURER_ROLE();
        const tx = await supplyChain.grantRole(MANUFACTURER_ROLE, address);
        await tx.wait();
        return { success: true, transaction: tx.hash };
    }

    async grantDistributorRole(address) {
        const supplyChain = await this.getSupplyChain();
        const DISTRIBUTOR_ROLE = await supplyChain.DISTRIBUTOR_ROLE();
        const tx = await supplyChain.grantRole(DISTRIBUTOR_ROLE, address);
        await tx.wait();
        return { success: true, transaction: tx.hash };
    }

    async grantRetailerRole(address) {
        const supplyChain = await this.getSupplyChain();
        const RETAILER_ROLE = await supplyChain.RETAILER_ROLE();
        const tx = await supplyChain.grantRole(RETAILER_ROLE, address);
        await tx.wait();
        return { success: true, transaction: tx.hash };
    }

    async checkRoles(address) {
        const supplyChain = await this.getSupplyChain();
        const [MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, RETAILER_ROLE] = await Promise.all([
            supplyChain.MANUFACTURER_ROLE(),
            supplyChain.DISTRIBUTOR_ROLE(),
            supplyChain.RETAILER_ROLE()
        ]);

        const [isManufacturer, isDistributor, isRetailer] = await Promise.all([
            supplyChain.hasRole(MANUFACTURER_ROLE, address),
            supplyChain.hasRole(DISTRIBUTOR_ROLE, address),
            supplyChain.hasRole(RETAILER_ROLE, address)
        ]);

        return {
            isManufacturer,
            isDistributor,
            isRetailer
        };
    }

    // Product Management
    async createProduct(name, manufacturer, price, tokenURI) {
        const supplyChain = await this.getSupplyChain();
        const tx = await supplyChain.createProduct(name, manufacturer, price, tokenURI);
        const receipt = await tx.wait();
        
        const event = receipt.events.find(e => e.event === 'ProductCreated');
        return {
            success: true,
            productId: event.args.productId.toString(),
            transaction: tx.hash
        };
    }

    async getProduct(tokenId) {
        const [productNFT, supplyChain] = await Promise.all([
            this.getProductNFT(),
            this.getSupplyChain()
        ]);

        const [product, shipment] = await Promise.all([
            productNFT.getProduct(tokenId),
            supplyChain.getCurrentShipment(tokenId)
        ]);

        return {
            name: product.name,
            manufacturer: product.manufacturer,
            manufactureDate: product.manufactureDate.toString(),
            status: product.status,
            currentOwner: product.currentOwner,
            currentShipment: {
                sender: shipment.sender,
                receiver: shipment.receiver,
                stage: shipment.stage,
                location: shipment.location,
                timestamp: shipment.timestamp.toString()
            }
        };
    }

    // Supply Chain Management
    async createShipment(productId, receiver, location) {
        const supplyChain = await this.getSupplyChain();
        const tx = await supplyChain.createShipment(productId, receiver, location);
        const receipt = await tx.wait();
        return {
            success: true,
            transaction: tx.hash
        };
    }

    async getShipmentHistory(productId) {
        const supplyChain = await this.getSupplyChain();
        return supplyChain.getShipmentHistory(productId);
    }

    // Contract Controls
    async pauseContract() {
        const supplyChain = await this.getSupplyChain();
        const tx = await supplyChain.pause();
        await tx.wait();
        return { success: true, transaction: tx.hash };
    }

    async unpauseContract() {
        const supplyChain = await this.getSupplyChain();
        const tx = await supplyChain.unpause();
        await tx.wait();
        return { success: true, transaction: tx.hash };
    }

    // Event Management
    subscribeToEvents(callback) {
        this.eventSubscribers.add(callback);
        return () => this.eventSubscribers.delete(callback);
    }

    unsubscribeFromEvents(callback) {
        this.eventSubscribers.delete(callback);
    }

    // Start listening to blockchain events
    async startEventListeners() {
        // Don't set up listeners in validation mode
        if (this._skipEventListeners) {
            console.log('Skipping event listener setup (validation mode)');
            return;
        }

        try {
            console.log('Setting up blockchain event listeners...');
            
            // Get contract instances
            const [productNFT, supplyChain] = await Promise.all([
                this.getProductNFT(),
                this.getSupplyChain()
            ]);

            // Create bound event handlers
            const handleProductCreated = (tokenId, manufacturer, name) => {
                this.broadcastEvent({
                    type: 'ProductCreated',
                    data: { tokenId, manufacturer, name }
                });
            };

            const handleShipmentCreated = (productId, sender, receiver) => {
                this.broadcastEvent({
                    type: 'ShipmentCreated',
                    data: { productId, sender, receiver }
                });
            };

            const handleStageUpdated = (productId, newStage) => {
                this.broadcastEvent({
                    type: 'StageUpdated',
                    data: { productId, newStage }
                });
            };

            // Set up event listeners with error handling
            productNFT.on('ProductCreated', handleProductCreated);
            productNFT.on('error', (error) => {
                console.error('ProductNFT event error:', error);
            });

            supplyChain.on('ShipmentCreated', handleShipmentCreated);
            supplyChain.on('StageUpdated', handleStageUpdated);
            supplyChain.on('error', (error) => {
                console.error('SupplyChain event error:', error);
            });

            console.log('Event listeners set up successfully');
        } catch (error) {
            console.error('Failed to set up event listeners:', error);
            throw new Error('Failed to initialize event listeners: ' + error.message);
        }
    }

    broadcastEvent(event) {
        for (const callback of this.eventSubscribers) {
            callback(event);
        }
    }

    // Configuration Validation
    async validateConfig() {
        const prevInitialized = this.initialized;
        const prevSkipEventListeners = this._skipEventListeners;
        
        try {
            // Reset initialization state for validation
            this.initialized = null;
            this._skipEventListeners = true;
            
            console.log('Starting blockchain configuration validation...');
            console.log('Current blockchain configuration:', {
                nodeUrl: process.env.ETHEREUM_NODE_URL || 'not set',
                productNFTAddress: this.addresses.productNFT || 'not set',
                supplyChainAddress: this.addresses.supplyChain || 'not set'
            });

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

            if (missingConfig.length > 0) {
                throw new Error(`Missing required configuration: ${missingConfig.join(', ')}`);
            }

            console.log('Configuration values present, testing network connection...');
            await this.testConnection(15000);

            console.log('Network connection successful, proceeding with basic initialization...');
            
            // Load and verify contracts
            await this.loadArtifacts();
            await this.checkContracts();

            console.log('Blockchain configuration validated successfully:', {
                nodeUrl: process.env.ETHEREUM_NODE_URL,
                productNFTAddress: this.addresses.productNFT,
                supplyChainAddress: this.addresses.supplyChain
            });
            return true;
        } catch (error) {
            console.error('Configuration validation failed:', error);
            throw new Error(`Configuration validation failed: ${error.message}`);
        } finally {
            // Restore previous state
            this.initialized = prevInitialized;
            this._skipEventListeners = prevSkipEventListeners;
        }
    }
}

// Create singleton instance
const blockchainController = new BlockchainController();
export default blockchainController;