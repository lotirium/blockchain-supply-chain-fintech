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

    async getNetworkStatus() {
        try {
            const network = await this.provider.getNetwork();
            
            try {
                const [blockNumber, feeData] = await Promise.all([
                    this.provider.getBlockNumber(),
                    this.provider.getFeeData()
                ]);

                return {
                    name: network.name,
                    chainId: network.chainId.toString(),
                    blockNumber: blockNumber.toString(),
                    gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : 'N/A',
                    isConnected: true
                };
            } catch (innerError) {
                console.warn('Connected to network but failed to get full details:', innerError);
                return {
                    name: network.name,
                    chainId: network.chainId.toString(),
                    isConnected: true,
                    blockNumber: 'N/A',
                    gasPrice: 'N/A'
                };
            }
        } catch (error) {
            console.error('Failed to get network status:', error);
            return {
                name: 'Not Connected',
                chainId: 'N/A',
                blockNumber: 'N/A',
                gasPrice: 'N/A',
                isConnected: false,
                error: error.message
            };
        }
    }

    async getProductNFT() {
        if (!this._productNFT) {
            await this.initialize();
        }
        return this._productNFT;
    }

    async getSupplyChain() {
        if (!this._supplyChain) {
            await this.initialize();
        }
        return this._supplyChain;
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

            console.log('Current blockchain configuration:', {
                nodeUrl: process.env.ETHEREUM_NODE_URL,
                productNFTAddress: this.addresses.productNFT,
                supplyChainAddress: this.addresses.supplyChain
            });

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