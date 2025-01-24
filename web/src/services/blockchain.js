/**
 * @fileoverview Blockchain service for handling NFT and product operations
 */

import axios from 'axios';
import { store } from '../store';

/**
 * Service class for handling blockchain operations
 */
class BlockchainService {
  /**
   * Initialize the blockchain service
   */
  constructor() {
    /** @type {import('axios').AxiosInstance} */
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      try {
        const token = store.getState().auth.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      } catch (error) {
        console.error('Error adding auth token:', error);
        return config;
      }
    });

    // Add response error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        throw error;
      }
    );
  }

  // Product Management Methods
  
  /**
   * Create a new product with NFT
   * @param {string} name - Product name
   * @param {string} manufacturer - Manufacturer name
   * @param {number} price - Product price
   * @param {string} description - Product description
   * @param {Array} [attributes=[]] - Product attributes
   * @returns {Promise<Object>} Created product data
   */
  async createProduct(name, manufacturer, price, description, attributes = []) {
    try {
      const response = await this.api.post('/api/blockchain/products', {
        name,
        manufacturer,
        price,
        description,
        attributes,
        metadata: {
          attributes,
          external_url: `${window.location.origin}/products/${name}`,
          image: null, // Will be updated after image upload
        }
      });
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Get product details including NFT and supply chain status
   * @param {string} tokenId - Product token ID
   * @returns {Promise<Object>} Product details
   */
  async getProduct(tokenId) {
    try {
      const [productResponse, nftResponse, supplyChainResponse] = await Promise.all([
        this.api.get(`/api/blockchain/products/${tokenId}`),
        this.getNFTStatus(tokenId),
        this.getSupplyChainStatus(tokenId)
      ]);

      return {
        ...productResponse.data,
        nft: nftResponse,
        supplyChain: supplyChainResponse
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Update product status
   * @param {string} tokenId - Product token ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated product data
   */
  async updateProductStatus(tokenId, status) {
    try {
      const response = await this.api.put(`/api/blockchain/products/${tokenId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Get NFT status
   * @param {string} tokenId - NFT token ID
   * @returns {Promise<Object>} NFT status data
   */
  async getNFTStatus(tokenId) {
    try {
      const response = await this.api.get(`/api/blockchain/nft/${tokenId}/status`);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Update NFT metadata
   * @param {string} tokenId - NFT token ID
   * @param {Object} metadata - New metadata
   * @returns {Promise<Object>} Updated NFT data
   */
  async updateNFTMetadata(tokenId, metadata) {
    try {
      const response = await this.api.put(`/api/blockchain/nft/${tokenId}/metadata`, {
        metadata
      });
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Transfer product ownership
   * @param {string} tokenId - Product token ID
   * @param {string} toAddress - Recipient address
   * @returns {Promise<Object>} Transfer result
   */
  async transferProduct(tokenId, toAddress) {
    try {
      const response = await this.api.post(`/api/blockchain/products/${tokenId}/transfer`, {
        toAddress,
      });
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Get supply chain status
   * @param {string} tokenId - Product token ID
   * @returns {Promise<Object>} Supply chain status
   */
  async getSupplyChainStatus(tokenId) {
    try {
      const response = await this.api.get(`/api/blockchain/products/${tokenId}/supply-chain`);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Update shipment status
   * @param {string} tokenId - Product token ID
   * @param {string} stage - Shipment stage
   * @param {Object} location - Location data
   * @returns {Promise<Object>} Updated shipment data
   */
  async updateShipmentStatus(tokenId, stage, location) {
    try {
      const response = await this.api.put(`/api/blockchain/products/${tokenId}/shipment`, {
        stage,
        location,
      });
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Upload product images and update NFT metadata
   * @param {string} tokenId - Product token ID
   * @param {Array<File>} images - Image files
   * @returns {Promise<Object>} Upload result
   */
  async uploadProductImages(tokenId, images) {
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });
      formData.append('tokenId', tokenId);

      const response = await this.api.post('/api/blockchain/products/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update NFT metadata with new image URLs
      await this.updateNFTMetadata(tokenId, {
        image: response.data.imageUrls[0], // Primary image
        additional_images: response.data.imageUrls.slice(1),
      });

      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Generate hologram data
   * @param {string} tokenId - Product token ID
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Hologram data
   */
  async generateHologram(tokenId, productData) {
    try {
      const response = await this.api.post(`/api/blockchain/products/${tokenId}/hologram`, {
        productData
      });
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Verify hologram authenticity
   * @param {string} hologramId - Hologram ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyHologram(hologramId) {
    try {
      const response = await this.api.get(`/api/blockchain/hologram/${hologramId}/verify`);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Get user's wallet address
   * @returns {string|null} Wallet address
   */
  getWalletAddress() {
    try {
      const { user } = store.getState().auth;
      return user?.walletAddress || null;
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  }

  /**
   * Check if user has a wallet
   * @returns {boolean} Whether user has a wallet
   */
  hasWallet() {
    return Boolean(this.getWalletAddress());
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @throws {Error} Formatted error
   */
  handleApiError(error) {
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
    if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
      console.error('API Error:', error);
    }
    throw new Error(errorMessage);
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;