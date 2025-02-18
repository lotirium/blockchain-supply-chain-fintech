import express from 'express';
import blockchainController from '../controllers/blockchain.mjs';
import auth from '../middleware/auth.mjs';

const router = express.Router();

// Wallet management endpoints
router.post('/wallet', auth(), async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await blockchainController.createUserWallet(userId);
        res.json(result);
    } catch (error) {
        console.error('Failed to create wallet:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/wallet/balance', auth(), async (req, res) => {
    try {
        const walletAddress = req.user.wallet_address;
        if (!walletAddress) {
            return res.status(400).json({ error: 'No wallet associated with user' });
        }
        const balance = await blockchainController.getWalletBalance(walletAddress);
        res.json({ balance });
    } catch (error) {
        console.error('Failed to get wallet balance:', error);
        res.status(500).json({ error: error.message });
    }
});

// LogiCoin endpoints
router.post('/logicoin/convert', auth(), async (req, res) => {
    try {
        const { usdAmount } = req.body;
        if (!usdAmount || usdAmount <= 0) {
            return res.status(400).json({ error: 'Invalid USD amount' });
        }

        const userId = req.user.id;
        if (!req.user.wallet_address) {
            return res.status(400).json({ 
                error: 'No wallet associated with user. Please create a wallet first.' 
            });
        }

        const result = await blockchainController.convertUSDToLogiCoin(usdAmount, userId);
        res.json(result);
    } catch (error) {
        console.error('Failed to convert USD to LogiCoin:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/logicoin/balance', auth(), async (req, res) => {
    try {
        const walletAddress = req.user.wallet_address;
        if (!walletAddress) {
            return res.status(400).json({ error: 'No wallet associated with user' });
        }
        const balance = await blockchainController.getWalletBalance(walletAddress);
        res.json({ logiCoinBalance: balance.logiCoin }); // Already formatted in whole tokens
    } catch (error) {
        console.error('Failed to get LogiCoin balance:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/logicoin/approve', auth(), async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const userId = req.user.id;
        if (!req.user.wallet_address) {
            return res.status(400).json({ 
                error: 'No wallet associated with user. Please create a wallet first.' 
            });
        }

        const result = await blockchainController.approveLogiCoinSpending(amount, userId);
        res.json(result);
    } catch (error) {
        console.error('Failed to approve LogiCoin spending:', error);
        res.status(500).json({ error: error.message });
    }
});

// Payment endpoints
router.post('/payments/:productId', auth(), async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        if (!req.user.wallet_address) {
            return res.status(400).json({ 
                error: 'No wallet associated with user. Please create a wallet first.' 
            });
        }

        const result = await blockchainController.payForProduct(productId, userId);
        res.json(result);
    } catch (error) {
        console.error('Payment failed:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/payments/:productId/status', auth(), async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (!req.user.wallet_address) {
            return res.status(400).json({ 
                error: 'No wallet associated with user. Please create a wallet first.' 
            });
        }

        const result = await blockchainController.getReleasePaymentStatus(productId);
        res.json(result);
    } catch (error) {
        console.error('Failed to get payment status:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/payments/:productId/release', auth(), async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await blockchainController.releasePayment(productId);
        res.json(result);
    } catch (error) {
        console.error('Failed to release payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Network status endpoint
router.get('/status', auth(), async (req, res) => {
    try {
        const status = await blockchainController.getNetworkStatus();
        res.json(status);
    } catch (error) {
        console.error('Failed to get network status:', error);
        res.status(500).json({
            isConnected: false,
            error: error.message
        });
    }
});

// Product endpoints
router.post('/products', auth(['seller']), async (req, res) => {
    try {
        const { name, price, tokenURI } = req.body;
        const result = await blockchainController.createProduct(req.user.wallet_address, name, req.user.storeName, tokenURI);
        res.json(result);
    } catch (error) {
        console.error('Failed to create product:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all NFT products
router.get('/products', async (req, res) => {
    try {
        const products = await blockchainController.getAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Failed to get all products:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get product price
router.get('/products/:tokenId/price', async (req, res) => {
    try {
        const price = await blockchainController.getProductPrice(req.params.tokenId);
        res.json({ price: price.toString() });
    } catch (error) {
        console.error('Failed to get product price:', error);
        res.status(500).json({ error: error.message });
    }
});


router.get('/products/:tokenId', async (req, res) => {
    try {
        const product = await blockchainController.getProduct(req.params.tokenId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Failed to get product:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/products/:tokenId/shipments', async (req, res) => {
    try {
        const history = await blockchainController.getShipmentHistory(req.params.tokenId);
        res.json(history);
    } catch (error) {
        console.error('Failed to get shipment history:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;