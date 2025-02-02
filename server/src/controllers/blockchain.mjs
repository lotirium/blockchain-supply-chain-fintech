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

    async getSigner() {
        if (!this._signer) {
            // Use first account as admin signer
            // Use Contract deployer's private key
            const deployerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
            this._signer = new ethers.Wallet(deployerPrivateKey, this.provider);
        }
        return this._signer;
    }

    async createProduct(recipientAddress, name, manufacturer, tokenURI) {
        try {
            await this.initialize(); // Ensure initialized
            const signer = await this.getSigner();
            
            // Get contract instances
            if (!SupplyChain?.abi) {
                await this.loadArtifacts();
            }

            const supplyChainContract = new ethers.Contract(
                this.addresses.supplyChain,
                SupplyChain.abi,
                signer
            );

            console.log('SupplyChain address:', this.addresses.supplyChain);
            console.log('Signer address:', await signer.getAddress());
            console.log('Creating product with params:', {
                name,
                manufacturer,
                price: 0,
                tokenURI
            });

            // Create product through SupplyChain contract
            // The createProduct function signature is:
            // function createProduct(string name, string manufacturer, uint256 price, string tokenURI)
            const createTx = await supplyChainContract.createProduct(
                name,
                manufacturer,
                ethers.parseEther('0'), // Price as wei (0 ETH)
                tokenURI
            );
            const createReceipt = await createTx.wait();

            // Get token ID from event
            // The SupplyChain contract emits its own ProductCreated event
            // We need to parse the transaction receipt logs to find the event
            const iface = new ethers.Interface(SupplyChain.abi);
            for (const log of createReceipt.logs) {
                try {
                    const parsedLog = iface.parseLog(log);
                    if (parsedLog && parsedLog.name === 'ProductCreated') {
                        return {
                            tokenId: parsedLog.args.productId.toString(),
                            transaction: createReceipt.hash
                        };
                    }
                } catch (e) {
                    // Skip logs that can't be parsed
                    continue;
                }
            }
            throw new Error('ProductCreated event not found in transaction');
        } catch (error) {
            console.error('Failed to create product NFT:', error);
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

    async getNetworkStatus() {
        try {
            const network = await this.provider.getNetwork();
            
            try {
                const [blockNumber, feeData] = await Promise.all([
                    this.provider.getBlockNumber(),
                    this.provider.getFeeData()
                ]);

                // Set network name to "Hardhat" if chainId is 31337
                const networkName = network.chainId === 31337n ? "Hardhat" : network.name;
                return {
                    name: networkName,
                    chainId: network.chainId.toString(),
                    blockNumber: blockNumber.toString(),
                    gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : 'N/A',
                    isConnected: true
                };
            } catch (innerError) {
                console.warn('Connected to network but failed to get full details:', innerError);
                const networkName = network.chainId === 31337n ? "Hardhat" : network.name;
                return {
                    name: networkName,
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

    async getShipmentHistory(productId) {
        try {
            const supplyChain = await this.getSupplyChain();
            const history = await supplyChain.getShipmentHistory(productId);
            
            // Convert BigInt timestamp to number for JSON serialization
            return history.map(shipment => ({
                sender: shipment.sender,
                receiver: shipment.receiver,
                stage: Number(shipment.stage),
                location: shipment.location,
                timestamp: Number(shipment.timestamp)
            }));
        } catch (error) {
            console.error('Failed to get shipment history:', error);
            throw new Error(`Failed to get shipment history: ${error.message}`);
        }
    }

    async getProduct(tokenId) {
        try {
            // Convert tokenId to a number and validate
            const numericTokenId = Number(tokenId);
            if (isNaN(numericTokenId)) {
                throw new Error('Invalid token ID format - must be a number');
            }

            const productNFT = await this.getProductNFT();
            const supplyChain = await this.getSupplyChain();

            const product = await productNFT.getProduct(numericTokenId);
            if (!product || !product.name) {
                throw new Error('No product found with this Token ID');
            }

            const shipment = await supplyChain.getShipmentHistory(numericTokenId);

            // Convert shipment history BigInt values
            const formattedShipment = shipment.map(s => ({
                sender: s.sender,
                receiver: s.receiver,
                stage: Number(s.stage),
                location: s.location,
                timestamp: Number(s.timestamp)
            }));

            return {
                id: numericTokenId,
                name: product.name,
                manufacturer: product.manufacturer,
                manufactureDate: Number(product.manufactureDate),
                status: Number(product.status),
                currentOwner: product.currentOwner,
                shipmentHistory: formattedShipment
            };
        } catch (error) {
            console.error(`Failed to get product ${tokenId}:`, error);
            if (error.message.includes('Invalid token ID format')) {
                throw new Error(error.message);
            }
            throw new Error('No product found with this Token ID');
        }
    }

    async getAllProducts() {
        try {
            const [productNFT, supplyChain] = await Promise.all([
                this.getProductNFT(),
                this.getSupplyChain()
            ]);
            
            const maxTokenId = Number(await productNFT.getCurrentTokenId());
            const products = [];
    
            // Get all products up to the current token ID
            for (let id = 1; id <= maxTokenId; id++) {
                try {
                    const product = await productNFT.getProduct(id);
                    const shipment = await supplyChain.getShipmentHistory(id);
                    
                    // Convert shipment history BigInt values
                    const formattedShipment = shipment.map(s => ({
                        sender: s.sender,
                        receiver: s.receiver,
                        stage: Number(s.stage),
                        location: s.location,
                        timestamp: Number(s.timestamp)
                    }));

                    products.push({
                        id: id,
                        name: product.name,
                        manufacturer: product.manufacturer,
                        manufactureDate: Number(product.manufactureDate),
                        status: Number(product.status),
                        currentOwner: product.currentOwner,
                        shipmentHistory: formattedShipment
                    });
                } catch (error) {
                    // Skip if product doesn't exist (might have been burned)
                    if (!error.message.includes("Product does not exist")) {
                        console.error(`Error fetching product ${id}:`, error);
                    }
                    continue;
                }
            }
            
            return products;
        } catch (error) {
            console.error('Failed to get all products:', error);
            throw new Error(`Failed to get all products: ${error.message}`);
        }
    }

    async pauseContract() {
        try {
            const supplyChain = await this.getSupplyChain();
            const signer = await this.getSigner();
            const contract = supplyChain.connect(signer);

            // Check if contract is already paused
            const isPaused = await contract.paused();
            if (isPaused) {
                return { success: false, message: 'Contract is already paused' };
            }

            const tx = await contract.pause();
            await tx.wait();
            
            return { success: true, transaction: tx.hash };
        } catch (error) {
            console.error('Failed to pause contract:', error);
            if (error.message.includes('Pausable: paused')) {
                return { success: false, message: 'Contract is already paused' };
            }
            throw new Error(`Failed to pause contract: ${error.message}`);
        }
    }

    async unpauseContract() {
        try {
            const supplyChain = await this.getSupplyChain();
            const signer = await this.getSigner();
            const contract = supplyChain.connect(signer);

            // Check if contract is already unpaused
            const isPaused = await contract.paused();
            if (!isPaused) {
                return { success: false, message: 'Contract is not paused' };
            }

            const tx = await contract.unpause();
            await tx.wait();
            
            return { success: true, transaction: tx.hash };
        } catch (error) {
            console.error('Failed to unpause contract:', error);
            if (error.message.includes('Pausable: not paused')) {
                return { success: false, message: 'Contract is not paused' };
            }
            throw new Error(`Failed to unpause contract: ${error.message}`);
        }
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