class BlockchainService {
    constructor() {
        this.isInitialized = false;
        this.networkDetails = null;
        this.eventSource = null;
    }

    // LogiCoin Management
    async convertUSDToLogiCoin(usdAmount) {
        const response = await fetch('/api/blockchain/logicoin/convert', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usdAmount })
        });
        return response.json();
    }

    async getLogiCoinBalance() {
        const response = await fetch('/api/blockchain/logicoin/balance', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    }

    async approveLogiCoinSpending(amount) {
        const response = await fetch('/api/blockchain/logicoin/approve', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount })
        });
        return response.json();
    }

    // Wallet management
    async createWallet() {
        const response = await fetch('/api/blockchain/wallet', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Payment failed');
        }
        return response.json();
    }

    async getWalletBalance() {
        const response = await fetch('/api/blockchain/wallet/balance', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    }

    // Payment Management
    async payForProduct(uuid) {
        // First fetch the product to get its tokenId
        const productResponse = await fetch(`/api/products/detail/${uuid}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const product = await productResponse.json();
        
        if (!product.token_id) {
            throw new Error('Product not found or has no token ID');
        }

        // First approve LogiCoin spending
        const price = await this.getProductPrice(product.token_id);
        console.log('Product price:', price, 'LogiCoins'); // Debug log
        const approveResult = await this.approveLogiCoinSpending(price);
        
        const response = await fetch(`/api/blockchain/payments/${product.token_id}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        return response.json();
    }

    async getReleasePaymentStatus(productId) {
        const response = await fetch(`/api/blockchain/payments/${productId}/status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    }

    async releasePayment(productId) {
        const response = await fetch(`/api/blockchain/payments/${productId}/release`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    }

    async getProductPrice(tokenId) {
        const response = await fetch(`/api/blockchain/products/${tokenId}/price`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        return data.price;
    }

    async initialize() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/blockchain/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                throw new Error('Unauthorized. Please make sure you are logged in as an admin.');
            }

            const data = await response.json();
            
            if (!data.isConnected) {
                throw new Error(data.error || 'Failed to connect to blockchain network');
            }

            this.networkDetails = data;
            this.isInitialized = true;
            return this.networkDetails;
        } catch (error) {
            console.error('Failed to initialize blockchain service:', error);
            this.networkDetails = {
                isConnected: false,
                name: 'Not Connected',
                chainId: 'N/A',
                blockNumber: 'N/A',
                gasPrice: 'N/A',
                error: error.message
            };
            throw error;
        }
    }

    getNetworkDetails() {
        return this.networkDetails;
    }

    // Product Management
    async createProduct(name, price, tokenURI) {
        const response = await fetch('/api/blockchain/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, tokenURI })
        });
        return response.json();
    }

    async getProduct(tokenId) {
        const response = await fetch(`/api/blockchain/products/${tokenId}`);
        return response.json();
    }

    async getAllProducts() {
        const response = await fetch('/api/blockchain/products');
        return response.json();
    }

    async updateProductStatus(tokenId, newStatus) {
        const response = await fetch(`/api/blockchain/products/${tokenId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        return response.json();
    }

    // Supply Chain Management
    async createShipment(productId, receiver, location) {
        const response = await fetch('/api/blockchain/shipments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, receiver, location })
        });
        return response.json();
    }

    async updateStage(productId, newStage) {
        const response = await fetch(`/api/blockchain/products/${productId}/stage`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: newStage })
        });
        return response.json();
    }

    async updateLocation(productId, newLocation) {
        const response = await fetch(`/api/blockchain/products/${productId}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: newLocation })
        });
        return response.json();
    }

    async getShipmentHistory(productId) {
        const response = await fetch(`/api/blockchain/products/${productId}/shipments`);
        return response.json();
    }

    async getCurrentShipment(productId) {
        const response = await fetch(`/api/blockchain/products/${productId}/current-shipment`);
        return response.json();
    }

    // Contract Management
    async pauseContract() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/blockchain/contract/pause', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.json();
    }

    async unpauseContract() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/blockchain/contract/unpause', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized. Please make sure you are logged in as an admin.');
        }
        
        return response.json();
    }

    // Event Handling
    setupEventSource() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.eventSource = new EventSource('/api/blockchain/events');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleBlockchainEvent(data);
        };

        this.eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            this.eventSource.close();
            setTimeout(() => this.setupEventSource(), 5000); // Retry after 5 seconds
        };
    }

    handleBlockchainEvent(event) {
        switch (event.type) {
            case 'ProductCreated':
                this.productEventCallback?.(event.data);
                break;
            case 'ShipmentCreated':
                this.shipmentEventCallback?.(event.data);
                break;
            case 'StageUpdated':
                this.stageUpdateEventCallback?.(event.data);
                break;
            case 'LogiCoinPurchased':
                this.logiCoinEventCallback?.(event.data);
                break;
        }
    }

    addProductEventListener(callback) {
        this.productEventCallback = callback;
    }

    addShipmentEventListener(callback) {
        this.shipmentEventCallback = callback;
    }

    addStageUpdateEventListener(callback) {
        this.stageUpdateEventCallback = callback;
    }

    addLogiCoinEventListener(callback) {
        this.logiCoinEventCallback = callback;
    }

    // Cleanup
    cleanup() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

export const blockchainService = new BlockchainService();