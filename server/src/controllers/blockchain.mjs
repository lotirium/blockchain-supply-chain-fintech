import { ethers } from 'ethers';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let ProductNFT;
let SupplyChain;

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

class BlockchainController {
    constructor() {
        // Get network configuration from environment variables
        const requiredChainId = parseInt(process.env.REQUIRED_CHAIN_ID || '31337');
        const nodeUrl = process.env.ETHEREUM_NODE_URL || 'http://127.0.0.1:8545';
        
        console.log('Initializing blockchain controller:', {
            nodeUrl,
            requiredChainId,
        });

        // Create provider with network configuration
        this.provider = new ethers.JsonRpcProvider(nodeUrl, {
            chainId: requiredChainId,
            name: process.env.REQUIRED_NETWORK_NAME || 'Hardhat Network',
            ensAddress: null
        });
        
        this.addresses = {
            productNFT: process.env.PRODUCT_NFT_ADDRESS,
            supplyChain: process.env.SUPPLY_CHAIN_ADDRESS
        };

        this._productNFT = null;
        this._supplyChain = null;
        this.initialized = null;
        this._signer = null;
        this._requiredChainId = requiredChainId;
    }

    async getSigner(storeWalletAddress = null) {
        if (storeWalletAddress) {
            // Look up store's private key from environment variables, case-insensitive
            const normalizedAddress = storeWalletAddress.slice(2).toLowerCase();
            const storeKeys = Object.keys(process.env)
                .filter(key => key.startsWith('STORE_') && key.endsWith('_KEY'));
            
            let privateKey = null;
            for (const key of storeKeys) {
                const keyAddress = key.replace('STORE_', '').replace('_KEY', '').toLowerCase();
                if (keyAddress === normalizedAddress) {
                    privateKey = process.env[key];
                    break;
                }
            }

            if (!privateKey) {
                throw new Error(`Private key not found for store wallet ${storeWalletAddress}`);
            }

            // Create wallet with correct network
            const wallet = new ethers.Wallet(privateKey, this.provider);
            const walletAddress = await wallet.getAddress();
            
            if (walletAddress.toLowerCase() !== storeWalletAddress.toLowerCase()) {
                console.error('Wallet address mismatch:', {
                    expected: storeWalletAddress,
                    actual: walletAddress
                });
                throw new Error('Wallet address mismatch');
            }

            return wallet;
        } else {
            // Use deployer wallet for admin operations
            if (!this._signer) {
                const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
                if (!deployerPrivateKey) {
                    throw new Error('Deployer private key not found in environment variables');
                }
                this._signer = new ethers.Wallet(deployerPrivateKey, this.provider);
            }
            return this._signer;
        }
    }

    async createProduct(storeWalletAddress, name, storeName, tokenURI) {
        try {
            await this.initialize(); // Ensure initialized
            
            // Use store wallet to create product since it needs RETAILER_ROLE
            const signer = await this.getSigner(storeWalletAddress);
            
            if (!ProductNFT?.abi || !SupplyChain?.abi) {
                await this.loadArtifacts();
            }

            // Format tokenURI - if it's already a string, use it as is
            const formattedTokenURI = typeof tokenURI === 'string' ? tokenURI : JSON.stringify(tokenURI);

            // Create default selling price (0.01 ETH) as BigInt
            const defaultPrice = BigInt('10000000000000000'); // 0.01 ETH in wei

            console.log('Creating product with params:', {
                wallet: await signer.getAddress(),
                name: name,
                seller: storeName, 
                tokenURI: formattedTokenURI,
                sellingPrice: defaultPrice.toString()
            });

            const supplyChainContract = new ethers.Contract(
                this.addresses.supplyChain,
                SupplyChain.abi,
                signer
            );

            // Verify chain ID before proceeding
            const network = await this.provider.getNetwork();
            if (network.chainId !== BigInt(this._requiredChainId)) {
                throw new Error(`Wrong network - expected chainId ${this._requiredChainId}, got ${network.chainId}`);
            }

            // Call createProduct with all required parameters
            const createProductTx = await supplyChainContract.createProduct(
                name,             // Product name
                storeName,        // Seller name
                0n,              // Unused price parameter as BigInt
                formattedTokenURI,    // Token URI
                defaultPrice     // Required selling price as BigInt
            );
            const createProductReceipt = await createProductTx.wait();

            // Get productId from the ProductCreated event
            const iface = new ethers.Interface(SupplyChain.abi);
            let productId;
            for (const log of createProductReceipt.logs) {
                try {
                    const parsedLog = iface.parseLog(log);
                    if (parsedLog && parsedLog.name === 'ProductCreated') {
                        productId = parsedLog.args.productId.toString();
                        break;
                    }
                } catch (e) {
                    // Skip logs that can't be parsed
                    continue;
                }
            }

            if (!productId) {
                console.error('Create product transaction successful but no product ID in logs:', createProductReceipt);
                throw new Error('Failed to get product ID from event');
            }

            return {
                success: true,
                tokenId: productId,
                transaction: createProductReceipt.hash
            };
        } catch (error) {
            console.error('Failed to create product:', {
                error: error.message,
                code: error.code,
                details: error.details || 'No additional details',
                transaction: error.transaction || 'No transaction data'
            });

            if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                throw new Error('Contract call failed - check parameters and permissions');
            }
            
            throw error;
        }
    }

    async loadArtifacts() {
        console.log('Initializing contract artifacts...');
        
        try {
            const productNFTPath = join(__dirname, '../contracts/ProductNFT.json');
            const supplyChainPath = join(__dirname, '../contracts/SupplyChain.json');

            const [productNFTJson, supplyChainJson] = await Promise.all([
                readFile(productNFTPath, 'utf8'),
                readFile(supplyChainPath, 'utf8')
            ]);

            ProductNFT = JSON.parse(productNFTJson);
            SupplyChain = JSON.parse(supplyChainJson);

            if (!ProductNFT?.abi || !SupplyChain?.abi) {
                throw new Error('Contract artifacts are missing ABI');
            }

            console.log('Contract artifacts loaded successfully');
        } catch (error) {
            console.error('Failed to load contract artifacts:', error);
            throw new Error(`Contract artifacts loading failed: ${error.message}`);
        }
    }

    async getNetworkStatus() {
        try {
            const network = await this.provider.getNetwork();
            return {
                name: network.name,
                chainId: network.chainId.toString(),
                isConnected: true,
                requiredChainId: this._requiredChainId.toString()
            };
        } catch (error) {
            console.error('Failed to get network status:', error);
            throw new Error('Failed to connect to blockchain network');
        }
    }

    async testConnection(retryCount = 0) {
        console.log(`Testing provider connection (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        try {
            // Test basic RPC connection
            const blockNumber = await this.provider.getBlockNumber();
            console.log('Current block number:', blockNumber);

            // Verify network
            const network = await this.provider.getNetwork();
            console.log('Connected to network:', {
                name: network.name,
                chainId: network.chainId.toString(),
                requiredChainId: this._requiredChainId
            });

            // Verify chainId matches required
            if (network.chainId !== BigInt(this._requiredChainId)) {
                throw new Error(`Wrong network - expected chainId ${this._requiredChainId}, got ${network.chainId}`);
            }

            return network;
        } catch (error) {
            console.error(`Connection attempt ${retryCount + 1} failed:`, error);
            
            if (retryCount < MAX_RETRIES - 1) {
                console.log(`Retrying in ${RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return this.testConnection(retryCount + 1);
            }

            if (error.message.includes('Wrong network')) {
                throw error;
            }
            
            throw new Error('Failed to connect to blockchain network - please check if the node is running');
        }
    }

    async initialize() {
        const TIMEOUT = 30000; // 30 seconds timeout

        // Use a promise to handle initialization state
        if (this.initialized) {
            return this.initialized;
        }

        // Create initialization promise
        this.initialized = (async () => {
            try {
                console.log('Starting blockchain controller initialization...');

                // Run validation first
                await this.validateConfig();

                // Test RPC connection with retries
                await this.testConnection();

                // Create contract instances
                this._productNFT = new ethers.Contract(
                    this.addresses.productNFT,
                    ProductNFT.abi,
                    this.provider
                );

                this._supplyChain = new ethers.Contract(
                    this.addresses.supplyChain,
                    SupplyChain.abi,
                    this.provider
                );

                console.log('Blockchain initialization completed successfully');
                return true;
            } catch (error) {
                console.error('Blockchain initialization failed:', error);
                this.initialized = null; // Reset initialization state
                throw error;
            }
        })();

        // Add timeout to initialization
        return Promise.race([
            this.initialized,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Initialization timeout')), TIMEOUT)
            )
        ]);
    }

    async validateConfig() {
        try {
            console.log('Starting blockchain configuration validation...');
            
            // Check environment variables first
            const missingConfig = [];
            if (!process.env.ETHEREUM_NODE_URL) {
                missingConfig.push('ETHEREUM_NODE_URL');
            }
            if (!process.env.REQUIRED_CHAIN_ID) {
                missingConfig.push('REQUIRED_CHAIN_ID');
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

            // Load artifacts first
            await this.loadArtifacts();
            console.log('Contract artifacts loaded successfully');

            // Test network connection with retries
            const network = await this.testConnection();
            console.log('Network connection successful:', network);

            // Verify contract accessibility
            await this.checkContracts();
            console.log('Contract verification successful');

            return true;
        } catch (error) {
            console.error('Configuration validation failed:', error);
            if (error.message.includes('ENOENT')) {
                throw new Error('Contract artifacts not found - please check if JSON files exist in src/contracts/');
            }
            throw new Error(`Configuration validation failed: ${error.message}`);
        }
    }

    async checkContracts() {
        try {
            if (!ProductNFT?.abi || !SupplyChain?.abi) {
                await this.loadArtifacts();
            }

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

            // Try to access contract methods to verify they're working
            await Promise.all([
                productNFT.getProduct(0).catch(() => {}),  // Ignore errors from non-existent tokens
                supplyChain.isRetailer(this.addresses.supplyChain).catch(() => {})
            ]);

            console.log('Contract instances verified successfully');
        } catch (error) {
            console.error('Contract verification failed:', error);
            throw new Error('Contract verification failed - please check contract addresses and ABIs');
        }
    }
}

const blockchainController = new BlockchainController();
export default blockchainController;