class BlockchainService {
    constructor() {
        this.isInitialized = false;
        this.networkDetails = null;
        this.eventSource = null;
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

            if (!response.ok) {
                const text = await response.text();
                console.error('API Error:', text);
                throw new Error('Failed to get blockchain status');
            }

            const data = await response.json();
            this.networkDetails = data;
            this.isInitialized = true;
            this.setupEventSource();
            return this.networkDetails;
        } catch (error) {
            console.error('Failed to initialize blockchain service:', error);
            if (error.message.includes('Unauthorized')) {
                throw error;
            }
            throw new Error('Failed to connect to blockchain network. Please make sure the blockchain node is running.');
        }
    }

    getNetworkDetails() {
        return this.networkDetails;
    }

    // Role Management
    async grantManufacturerRole(address) {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/blockchain/roles/manufacturer', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address })
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized. Please make sure you are logged in as an admin.');
        }
        
        return response.json();
    }

    async grantDistributorRole(address) {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/blockchain/roles/distributor', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address })
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized. Please make sure you are logged in as an admin.');
        }
        
        return response.json();
    }

    async grantRetailerRole(address) {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/blockchain/roles/retailer', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address })
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized. Please make sure you are logged in as an admin.');
        }
        
        return response.json();
    }

    async checkRole(address) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/blockchain/roles/${address}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized. Please make sure you are logged in.');
        }
        
        return response.json();
    }

    // Product Management
    async createProduct(name, manufacturer, price, tokenURI) {
        const response = await fetch('/api/blockchain/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, manufacturer, price, tokenURI })
        });
        return response.json();
    }

    async getProduct(tokenId) {
        const response = await fetch(`/api/blockchain/products/${tokenId}`);
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

    // Cleanup
    cleanup() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

export const blockchainService = new BlockchainService();