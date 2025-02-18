import { ethers } from 'ethers';
import crypto from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let ProductNFT;
let SupplyChain;
let LogiCoin;

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

class BlockchainController {
    constructor() {
        const requiredChainId = parseInt(process.env.REQUIRED_CHAIN_ID || '31337');
        const nodeUrl = process.env.ETHEREUM_NODE_URL || 'http://127.0.0.1:8545';
        
        const accessControlAbi = [
            "function grantRole(bytes32 role, address account)",
            "function revokeRole(bytes32 role, address account)",
            "function renounceRole(bytes32 role, address account)",
            "function hasRole(bytes32 role, address account) view returns (bool)",
            "function getRoleAdmin(bytes32 role) view returns (bytes32)"
        ];

        console.log('Initializing blockchain controller:', {
            nodeUrl,
            requiredChainId,
        });

        this.provider = new ethers.JsonRpcProvider(nodeUrl, {
            chainId: requiredChainId,
            name: process.env.REQUIRED_NETWORK_NAME || 'Hardhat Network',
            ensAddress: null
        });
        
        this.addresses = {
            productNFT: process.env.PRODUCT_NFT_ADDRESS,
            supplyChain: process.env.SUPPLY_CHAIN_ADDRESS,
            logiCoin: process.env.LOGICOIN_ADDRESS
        };

        console.log('Contract addresses:', this.addresses);

        this._productNFT = null;
        this._supplyChain = null;
        this._logiCoin = null;
        this.initialized = null;
        this._signer = null;
        this._accessControlAbi = accessControlAbi;
        this._supplyChainAbi = null;
        this._requiredChainId = requiredChainId;
    }

    async createUserWallet(userId) {
        try {
            // Ensure blockchain controller is fully initialized
            await this.initialize();
    
            // Check if user already has a wallet
            const User = (await import('../models/User.mjs')).default;
            const user = await User.findByPk(userId);
            if (user?.walletAddress) {
                throw new Error('User already has a wallet');
            }
    
            // Generate new wallet with ethers
            const wallet = ethers.Wallet.createRandom();
            
            // Verify wallet was created successfully
            if (!wallet.address || !wallet.privateKey) {
                throw new Error('Failed to generate wallet');
            }
    
            // Encrypt private key
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, key, iv);
    
            let encrypted = cipher.update(wallet.privateKey, 'utf8', 'hex');
            encrypted += cipher.final('hex');
    
            // Update user with wallet address and encrypted key 
            const [updated] = await User.update({
                wallet_address: wallet.address,
                encrypted_private_key: encrypted,
                iv: iv.toString('hex')
            }, {
                where: { id: userId }
            });
    
            if (!updated) {
                throw new Error('Failed to update user with wallet address');
            }
    
            // Fund the new wallet with some test ETH if in development
            if (process.env.NODE_ENV === 'development') {
                const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
                if (!deployerPrivateKey) {
                    throw new Error('Deployer private key not found in environment variables');
                }
    
                if (!/^0x[0-9a-fA-F]{64}$/.test(deployerPrivateKey)) {
                    throw new Error('Invalid deployer private key format');
                }
    
                const deployer = new ethers.Wallet(deployerPrivateKey, this.provider);
                
                // Fund with ETH for gas
                const fundTx = await deployer.sendTransaction({
                    to: wallet.address,
                    value: ethers.parseEther("5.0") // Increased ETH for plenty of gas fees
                });
                await fundTx.wait(1);
                
                // Initial LogiCoin balance - Ensure _logiCoin is initialized
                // For $1000.00, pass 100000 (includes 2 decimals)
                await this._logiCoin.connect(deployer).mintFromUSD(wallet.address, 1000_00);
            }
    
            return {
                success: true,
                walletAddress: wallet.address,
                balance: {
                    eth: process.env.NODE_ENV === 'development' ? "5.0" : "0.0",
                    logiCoin: process.env.NODE_ENV === 'development' ? "100000" : "0" // Will show 1000.00 USD worth
                }
            };
        } catch (error) {
            console.error('Failed to create wallet:', error);
            throw new Error(`Failed to create wallet: ${error.message}`);
        }
    }

    async getUserWallet(userId) {
        try {
            // Import the User model
            const User = (await import('../models/User.mjs')).default;
    
            // Fetch the user record by ID
            const user = await User.findByPk(userId);
            if (!user || !user.wallet_address) {
                throw new Error('User wallet not found');
            }
    
            // Validate encrypted private key and IV
            const { encrypted_private_key: encryptedPrivateKey, iv } = user;
            if (!encryptedPrivateKey || !iv) {
                throw new Error('Encrypted private key or IV missing');
            }
    
            // Decrypt the private key
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
            const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    
            let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
    
            // Create and return the ethers Wallet instance
            return new ethers.Wallet(decrypted, this.provider);
        } catch (error) {
            console.error('Failed to get user wallet:', error);
            throw new Error(`Failed to get user wallet: ${error.message}`);
        }
    }
    
    async getProductPrice(tokenId) {
        try {
            await this.initialize();
    
            if (!this._supplyChain) {
                throw new Error('SupplyChain contract not initialized');
            }
    
            // Get product price in USD (assuming price is stored in cents)
            const priceInCents = await this._supplyChain.getProductPrice(tokenId);
    
            // Convert USD to LogiCoin tokens
            const logiCoinContract = this._logiCoin.connect(this.provider);
            const priceInLogiCoins = await logiCoinContract.usdToTokens(priceInCents);
    
            return {
                success: true,
                tokenId,
                price: priceInLogiCoins.toString() // Price in LogiCoin tokens
            };
        } catch (error) {
            console.error('Failed to get product price:', error);
            throw new Error(`Failed to get product price: ${error.message}`);
        }
    }

    async getWalletBalance(address) {
        try {
            await this.initialize();
    
            if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
                throw new Error('Invalid wallet address');
            }
    
            const [ethBalance, logiCoinBalance] = await Promise.all([
                this.provider.getBalance(address),
                this._logiCoin.balanceOf(address)
            ]);
    
            return {
                eth: ethers.formatEther(ethBalance), // Formatted ETH balance for display
                logiCoin: logiCoinBalance.toString() // Raw LogiCoin balance in smallest unit
            };
        } catch (error) {
            console.error('Failed to get wallet balance:', error);
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    async convertUSDToLogiCoin(usdAmount, userId) {
        try {
            await this.initialize();
            const wallet = await this.getUserWallet(userId);            
            
            // Convert USD amount to cents (89.99 -> 8999)
            const usdInCents = Math.round(usdAmount * 100);
            console.log('Converting USD to LogiCoin:', {
                usdAmount,
                usdInCents,
                walletAddress: wallet.address
            });
            
            // Get admin signer to mint tokens
            const adminSigner = await this.getSigner();
            const logiCoinContract = this._logiCoin.connect(adminSigner);
            
            // Mint tokens to user's wallet
            // Amount is in cents, which LogiCoin contract will multiply by 100
            const tx = await logiCoinContract.mintFromUSD(wallet.address, usdInCents);
            await tx.wait();

            return {
                success: true,
                transaction: tx.hash,
                amount: usdAmount,
                logiCoins: (usdInCents * 100).toString() // Convert amount to LogiCoins
            };
        } catch (error) {
            console.error('Failed to convert USD to LogiCoin:', error);
            throw new Error(`USD to LogiCoin conversion failed: ${error.message}`);
        }
    }

    async approveLogiCoinSpending(amount, userId) {
        try {
            await this.initialize();
            const wallet = await this.getUserWallet(userId);
            const logiCoinContract = this._logiCoin.connect(wallet);
            
            const tx = await logiCoinContract.approve(this.addresses.supplyChain, amount);
            await tx.wait();

            return {
                success: true,
                transaction: tx.hash
            };
        } catch (error) {
            console.error('Failed to approve LogiCoin spending:', error);
            throw new Error(`LogiCoin approval failed: ${error.message}`);
        }
    }

    async payForProduct(tokenId, userId) {
        try {
            await this.initialize();
    
            if (!this._supplyChain) {
                throw new Error('SupplyChain contract not initialized');
            }
    
            // Get user's wallet
            const wallet = await this.getUserWallet(userId);
            if (!wallet) {
                throw new Error('Failed to get user wallet');
            }
    
            console.log('Processing payment with wallet:', {
                walletAddress: await wallet.getAddress()
            });
    
            const contract = this._supplyChain.connect(wallet);
    
            // Get product price in LogiCoin tokens
            let price;
            try {
                const priceResponse = await this.getProductPrice(tokenId);
                price = BigInt(priceResponse.price); // Convert to BigInt for precision
                console.log('Product price from contract:', {
                    tokenId,
                    price: price.toString()
                });
            } catch (error) {
                throw new Error(`Failed to get product price: ${error.message}`);
            }
    
            // Check user's LogiCoin balance
            const logiCoinBalanceRaw = await this._logiCoin.balanceOf(wallet.address);
            const logiCoinBalance = BigInt(logiCoinBalanceRaw); // Ensure balance is treated as BigInt
    
            if (logiCoinBalance < price) {
                const formattedBalance = ethers.formatUnits(logiCoinBalance, 18); // Convert to whole tokens
                const formattedPrice = ethers.formatUnits(price, 18); // Convert to whole tokens
                throw new Error(`Insufficient LogiCoin balance: ${formattedBalance} < ${formattedPrice}`);
            }
    
            // Approve LogiCoin spending
            const logiCoinContract = this._logiCoin.connect(wallet);
            const approveTx = await logiCoinContract.approve(this.addresses.supplyChain, price);
            await approveTx.wait();
    
            // Execute payment transaction
            const tx = await contract.payForProduct(tokenId);
            const receipt = await tx.wait(1);
    
            return {
                success: true,
                transaction: tx.hash,
                price: price.toString(),
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Failed to pay for product:', error.message);
            throw new Error(`Payment failed: ${error.message}`);
        }
    }

    async getReleasePaymentStatus(tokenId) {
        try {
            await this.initialize();

            if (!this._supplyChain) {
                throw new Error('SupplyChain contract not initialized');
            }

            const escrowBalance = await this._supplyChain.escrowBalances(tokenId);
            const beneficiary = await this._supplyChain.escrowBeneficiary(tokenId);

            return {
                hasPayment: escrowBalance > 0,
                escrowBalance: escrowBalance.toString(),
                beneficiary
            };
        } catch (error) {
            console.error('Failed to get payment status:', error);
            throw new Error(`Failed to get payment status: ${error.message}`);
        }
    }

    async releasePayment(tokenId) {
        try {
            await this.initialize();

            if (!this._supplyChain) {
                throw new Error('SupplyChain contract not initialized');
            }

            const signer = await this.getSigner();
            const contract = this._supplyChain.connect(signer);

            const tx = await contract.releasePayment(tokenId);
            const receipt = await tx.wait();

            return {
                success: true,
                transaction: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Failed to release payment:', error);
            throw new Error(`Payment release failed: ${error.message}`);
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
            const logiCoinPath = join(__dirname, '../contracts/LogiCoin.json');

            console.log('Loading artifacts from:', {
                productNFTPath,
                supplyChainPath,
                logiCoinPath
            });

            const [productNFTJson, supplyChainJson, logiCoinJson] = await Promise.all([
                readFile(productNFTPath, 'utf8'),
                readFile(supplyChainPath, 'utf8'),
                readFile(logiCoinPath, 'utf8')
            ]);

            ProductNFT = JSON.parse(productNFTJson);
            SupplyChain = JSON.parse(supplyChainJson);
            LogiCoin = JSON.parse(logiCoinJson);

            this._supplyChainAbi = [...SupplyChain.abi, ...this._accessControlAbi];

            if (!ProductNFT?.abi || !SupplyChain?.abi || !LogiCoin?.abi) {
                throw new Error('Contract artifacts are missing ABI');
            }

            console.log('Contract artifacts loaded successfully');
        } catch (error) {
            console.error('Failed to load contract artifacts:', error);
            throw new Error(`Contract artifacts loading failed: ${error.message}`);
        }
    }

    async grantRetailerRole(address) {
        try {
            await this.initialize();

            if (!this._supplyChain) {
                throw new Error('SupplyChain contract not initialized');
            }

            // Get deployer signer for granting roles
            const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
            if (!deployerPrivateKey) {
                throw new Error('Deployer private key not found in environment variables');
            }

            const deployer = new ethers.Wallet(deployerPrivateKey, this.provider);
            const contract = this._supplyChain.connect(deployer);

            // Get RETAILER_ROLE bytes32 value
            const RETAILER_ROLE = ethers.id('RETAILER_ROLE');

            // Grant RETAILER_ROLE to the address
            const tx = await contract.grantRole(RETAILER_ROLE, address);
            await tx.wait();

            return {
                success: true,
                transaction: tx.hash
            };
        } catch (error) {
            console.error('Failed to grant retailer role:', error);
            throw new Error(`Failed to grant retailer role: ${error.message}`);
        }
    }

    async getSigner(walletAddress) {
        try {
            if (walletAddress) {
                // Format key name to match setupStoreWallet format
                const storeKey = `STORE_${walletAddress.slice(2).toUpperCase()}_KEY`;
                const privateKey = process.env[storeKey];
                
                if (!privateKey) {
                    throw new Error(`No private key found for wallet address ${walletAddress}`);
                }
                
                // Add 0x prefix to private key since we store it without prefix
                return new ethers.Wallet(`0x${privateKey}`, this.provider);
            }

            // If no wallet address provided, use deployer as default signer
            const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
            if (!deployerPrivateKey) {
                throw new Error('Deployer private key not found in environment variables');
            }

            if (!this._signer) {
                this._signer = new ethers.Wallet(deployerPrivateKey, this.provider);
            }

            return this._signer;
        } catch (error) {
            console.error('Failed to get signer:', error);
            throw new Error(`Failed to get signer: ${error.message}`);
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
        const TIMEOUT = 30000;

        if (this.initialized) {
            return this.initialized;
        }

        this.initialized = (async () => {
            try {
                console.log('Starting blockchain controller initialization...');

                await this.validateConfig();
                await this.testConnection();

                // Load artifacts if not loaded
                if (!ProductNFT?.abi || !SupplyChain?.abi || !LogiCoin?.abi) {
                    await this.loadArtifacts();
                }

                // Create contract instances
                this._productNFT = new ethers.Contract(
                    this.addresses.productNFT,
                    ProductNFT.abi,
                    this.provider
                );

                this._supplyChain = new ethers.Contract(
                    this.addresses.supplyChain,
                    this._supplyChainAbi,
                    this.provider
                );

                this._logiCoin = new ethers.Contract(
                    this.addresses.logiCoin,
                    LogiCoin.abi,
                    this.provider
                );

                // Verify contracts are properly initialized
                console.log('Verifying contract instances:', {
                    productNFT: !!this._productNFT,
                    supplyChain: !!this._supplyChain,
                    logiCoin: !!this._logiCoin
                });

                // Test contract access
                await Promise.all([
                    this._logiCoin.name(),
                    this._logiCoin.symbol()
                ]);

                console.log('Blockchain initialization completed successfully');
                return true;
            } catch (error) {
                console.error('Blockchain initialization failed:', error);
                this.initialized = null;
                throw error;
            }
        })();

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
            
            const missingConfig = [];
            if (!process.env.ETHEREUM_NODE_URL) missingConfig.push('ETHEREUM_NODE_URL');
            if (!process.env.REQUIRED_CHAIN_ID) missingConfig.push('REQUIRED_CHAIN_ID');
            if (!this.addresses.productNFT) missingConfig.push('PRODUCT_NFT_ADDRESS');
            if (!this.addresses.supplyChain) missingConfig.push('SUPPLY_CHAIN_ADDRESS');
            if (!this.addresses.logiCoin) missingConfig.push('LOGICOIN_ADDRESS');

            if (missingConfig.length > 0) {
                throw new Error(`Missing required configuration: ${missingConfig.join(', ')}`);
            }

            await this.loadArtifacts();
            console.log('Contract artifacts loaded successfully');

            const network = await this.testConnection();
            console.log('Network connection successful:', network);

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
            if (!ProductNFT?.abi || !SupplyChain?.abi || !LogiCoin?.abi) {
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

            const logiCoin = new ethers.Contract(
                this.addresses.logiCoin,
                LogiCoin.abi,
                this.provider
            );

            // Test contract methods
            await Promise.all([
                productNFT.getProduct(0).catch(() => {}),
                supplyChain.isRetailer(this.addresses.supplyChain).catch(() => {}),
                logiCoin.name().catch(() => {})
            ]);

            console.log('Contract instances verified successfully');
        } catch (error) {
            console.error('Contract verification failed:', error);
            throw new Error('Contract verification failed - please check contract addresses and ABIs');
        }
    }

    async getProduct(tokenId) {
        try {
            await this.initialize();


            if (!this._productNFT) {
                throw new Error('ProductNFT contract not initialized');
            }


            // First get the properties we know work
            const [tokenURI, currentOwner] = await Promise.all([
                this._productNFT.tokenURI(tokenId),
                this._productNFT.ownerOf(tokenId)
            ]);


            // Build function signature and encode parameters
            const functionSignature = 'getProduct(uint256)';
            const functionSelector = ethers.id(functionSignature).slice(0, 10);
            const encodedParams = ethers.zeroPadValue(ethers.toBeHex(tokenId), 32);
            const data = functionSelector + encodedParams.slice(2);


            // Make the call
            const result = await this.provider.call({
                to: this.addresses.productNFT,
                data
            });


            // Manual decode based on the known return structure
            const decodedStrings = ethers.AbiCoder.defaultAbiCoder().decode(
                ['string', 'string', 'uint256', 'string', 'address'],
                '0x' + result.slice(2)
            );


            return {
                id: tokenId,
                name: decodedStrings[0],
                seller: decodedStrings[1], 
                creationDate: decodedStrings[2].toString(),
                status: decodedStrings[3],
                owner: currentOwner,
                tokenURI,
            };
        } catch (error) {
            console.error('Failed to get product:', error);
            // Return minimal product info if full decode fails
            return {
                id: tokenId,
                owner: currentOwner,
                tokenURI,
                status: 'Unknown'
            };
        }
    }

    async getProductNFT() {
        await this.initialize();
        if (!this._productNFT) {
            throw new Error('ProductNFT contract not initialized');
        }
        return this._productNFT;
    }

    async getSupplyChain() {
        await this.initialize();
        if (!this._supplyChain) {
            throw new Error('SupplyChain contract not initialized');
        }
        return this._supplyChain;
    }

    async getShipmentHistory(tokenId) {
        try {
            await this.initialize();


            if (!this._supplyChain) {
                throw new Error('SupplyChain contract not initialized');
            }


            // Stage enum mapping
            const stages = [
                'Created',
                'InProduction', 
                'InTransit',
                'Delivered',
                'ForSale',
                'Sold',
                'Returned',
                'Recalled'
            ];


            // Create interface for just the event we need
            const iface = new ethers.Interface([
                "event StageUpdated(uint256 indexed productId, uint8 newStage)"
            ]);


            // Get event logs
            const logs = await this.provider.getLogs({
                address: this.addresses.supplyChain,
                topics: [
                    iface.getEvent("StageUpdated").topicHash,
                    ethers.zeroPadValue(ethers.toBeHex(tokenId), 32)
                ],
                fromBlock: 0
            });


            // Map logs to history entries
            const entries = await Promise.all(logs.map(async log => {
                const parsed = iface.parseLog(log);
                if (!parsed) return null;


                const block = await this.provider.getBlock(log.blockHash);
                return {
                    stage: stages[Number(parsed.args.newStage)] || 'Unknown',
                    timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date().toISOString(),
                    blockNumber: log.blockNumber
                };
            }));


                return entries.filter(Boolean).sort((a, b) => a.blockNumber - b.blockNumber);
    
            } catch (error) {
                console.error('Failed to get shipment history:', error);
                throw new Error(`Failed to get shipment history: ${error.message}`);
            }
        }

    async getAllProducts() {
        try {
            await this.initialize();

            if (!this._productNFT) {
                throw new Error('ProductNFT contract not initialized');
            }

            // Get total supply of tokens
            const totalSupply = await this._productNFT.totalSupply();

            // Get all products in parallel
            const tokenIds = Array.from({ length: Number(totalSupply) }, (_, i) => i);
            const products = await Promise.all(
                tokenIds.map(async (id) => {
                    try {
                        return await this.getProduct(id);
                    } catch (error) {
                        console.error(`Failed to get product ${id}:`, error);
                        return null;
                    }
                })
            );

            // Filter out failed or burned tokens
            return products.filter(product => 
                product && 
                product.owner && 
                product.owner !== ethers.ZeroAddress
            );

        } catch (error) {
            console.error('Failed to get all products:', error);
            throw new Error(`Failed to get all products: ${error.message}`);
        }
    }

    async updateStage(productId, stage) {
        try {
            await this.initialize();

            if (!this._supplyChain) {
                throw new Error('SupplyChain contract not initialized');
            }

            // Get deployer signer for updating stage (since we need RETAILER_ROLE)
            const signer = await this.getSigner();
            const contract = this._supplyChain.connect(signer);

            // Map string stage to enum value
            const stages = ['Created', 'InProduction', 'InTransit', 'Delivered', 'ForSale', 'Sold', 'Returned', 'Recalled'];
            const stageIndex = stages.indexOf(stage);
            if (stageIndex === -1) {
                throw new Error('Invalid stage value');
            }

            const tx = await contract.updateStage(productId, stageIndex);
            await tx.wait();
            return { success: true, transaction: tx.hash };
        } catch (error) {
            console.error('Failed to update product stage:', error);
            throw new Error(`Failed to update product stage: ${error.message}`);
        }
    }
}

const blockchainController = new BlockchainController();
export default blockchainController;