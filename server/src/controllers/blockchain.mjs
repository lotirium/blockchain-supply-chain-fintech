import { ethers } from 'ethers';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let ProductNFT;
let SupplyChain;

class BlockchainController {
    constructor() {
        const nodeUrl = process.env.ETHEREUM_NODE_URL || 'http://127.0.0.1:8545';
        this.provider = new ethers.JsonRpcProvider(nodeUrl);
        
        this.addresses = {
            productNFT: process.env.PRODUCT_NFT_ADDRESS,
            supplyChain: process.env.SUPPLY_CHAIN_ADDRESS
        };

        this._productNFT = null;
        this._supplyChain = null;
        this.initialized = null;
        this._signer = null;
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

            console.log('Looking up store wallet:', {
                address: storeWalletAddress,
                normalizedAddress: normalizedAddress,
                hasPrivateKey: !!privateKey,
                availableKeys: storeKeys
            });

            if (!privateKey) {
                throw new Error(`Private key not found for store wallet ${storeWalletAddress}`);
            }

            const wallet = new ethers.Wallet(privateKey, this.provider);
            const walletAddress = await wallet.getAddress();
            console.log('Created wallet with address:', walletAddress);
            
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
            // Use deployer wallet since createProduct is onlyOwner
            const signer = await this.getSigner();
            
            if (!ProductNFT?.abi || !SupplyChain?.abi) {
                await this.loadArtifacts();
            }

            // First get ProductNFT contract
            const productNFTContract = new ethers.Contract(
                this.addresses.productNFT,
                ProductNFT.abi,
                signer
            );
            
            // Format tokenURI if it's an object
            const formattedTokenURI = typeof tokenURI === 'object' ? JSON.stringify(tokenURI) : tokenURI;

            console.log('Creating NFT with params:', {
                deployer: await signer.getAddress(),
                recipient: storeWalletAddress,
                name: name,
                seller: storeName, 
                tokenURI: tokenURI
            });
            
            // Verify owner
            try {
                const owner = await productNFTContract.owner();
                if (owner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
                    throw new Error('Deployer wallet is not the contract owner');
                }
            } catch (error) {
                throw new Error('Failed to verify contract owner: ' + error.message);
            }

            // Create NFT first
            const createNFTTx = await productNFTContract.createProduct(
                storeWalletAddress,
                name,
                storeName,
                formattedTokenURI
            );
            const createNFTReceipt = await createNFTTx.wait();

            // Get token ID from the ProductCreated event
            const iface = new ethers.Interface(ProductNFT.abi);
            let tokenId;
            for (const log of createNFTReceipt.logs) {
                try {
                    const parsedLog = iface.parseLog(log);
                    if (parsedLog && parsedLog.name === 'ProductCreated') {
                        tokenId = parsedLog.args.tokenId.toString();
                        break;
                    }
                } catch (e) {
                    // Skip logs that can't be parsed
                    continue;
                }
            }

            if (!tokenId) {
                console.error('Create NFT transaction successful but no token ID in logs:', createNFTReceipt);
                throw new Error('Failed to get token ID from event');
            }

            return {
                success: true,
                tokenId: tokenId,
                transaction: createNFTReceipt.hash
            };
        } catch (error) {
            console.error('Failed to create product NFT:', {
                error: error.message,
                code: error.code,
                details: error.details || 'No additional details',
                transaction: error.transaction || 'No transaction data'
            });

            if (error.message.includes('not the contract owner')) {
                throw new Error('Permission denied: deployer wallet is not the contract owner');
            }
            
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

    async testConnection() {
        console.log('Testing provider connection...');
        const network = await this.provider.getNetwork();
        console.log('Connected to network:', {
            name: network.name,
            chainId: network.chainId
        });
        return network;
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
                supplyChain.getCurrentShipment(0).catch(() => {})
            ]);

            console.log('Contract instances verified successfully');
        } catch (error) {
            console.error('Contract verification failed:', error);
            throw new Error('Contract verification failed - please check contract addresses and ABIs');
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
                
                if (error.message.includes('Network connection timeout')) {
                    throw new Error('Failed to connect to blockchain network - please check if the node is running');
                }
                
                if (error.message.includes('Contract artifacts')) {
                    throw new Error('Failed to load contract artifacts - please check contract JSON files');
                }
                
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

            // Test network connection
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
}

const blockchainController = new BlockchainController();
export default blockchainController;