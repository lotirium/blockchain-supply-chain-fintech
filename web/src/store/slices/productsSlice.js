import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Simulated product data - in a real app, this would come from an API
const initialProducts = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 99.99,
    category: 'electronics',
    description: 'High-quality wireless headphones with noise cancellation',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    stock: 15
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 199.99,
    category: 'electronics',
    description: 'Feature-rich smartwatch with health tracking',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
    stock: 10
  },
  {
    id: 3,
    name: 'Running Shoes',
    price: 79.99,
    category: 'sports',
    description: 'Comfortable running shoes for all terrains',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    stock: 20
  },
  {
    id: 4,
    name: 'Digital Camera',
    price: 599.99,
    category: 'electronics',
    description: 'Professional digital camera with 4K video capability',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
    stock: 8
  },
  {
    id: 5,
    name: 'Leather Backpack',
    price: 129.99,
    category: 'fashion',
    description: 'Stylish leather backpack for everyday use',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
    stock: 12
  },
  {
    id: 6,
    name: 'Coffee Maker',
    price: 89.99,
    category: 'home',
    description: 'Automatic drip coffee maker with timer',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80',
    stock: 15
  }
];

const initialState = {
  items: initialProducts,
  filteredItems: initialProducts,
  categories: ['all', 'electronics', 'sports', 'fashion', 'home'],
  currentCategory: 'all',
  sortBy: 'name',
  loading: false,
  error: null,
  blockchainStatus: {}, // Track blockchain verification status for each product,
  supplyChainStatus: {}, // Track supply chain status for each product,
  nftOwnership: {}, // Track NFT ownership information,
  pendingTransactions: [], // Track pending blockchain transactions
};

/**
 * Helper function to generate hologram data
 * @param {Object} product - The product object
 * @param {Object} nftData - The NFT data object
 * @returns {Promise<Object>} The generated hologram data
 */
const generateHologramData = async (product, nftData) => {
  // This would be replaced with actual hologram generation logic
  return {
    hologramId: `HOL-${Date.now()}`,
    qrCode: `https://verify.example.com/product/${product.id}`,
    nftReference: nftData.tokenId,
    createdAt: new Date().toISOString()
  };
};

// Async thunks
export const createProductWithNFT = createAsyncThunk(
  'products/createProductWithNFT',
  async (productData, { getState, dispatch }) => {
    try {
      // 1. Create the product with IPFS image URLs
      const product = {
        ...productData,
        images: productData.imageUrls, // Use IPFS URLs directly from AddProduct component
        id: Date.now(), // This would be replaced with proper ID from backend
        stock: parseInt(productData.stock) || 0,
        status: 'active'
      };

      // 3. Mint NFT for the product
      const blockchainService = await import('../../services/blockchain').then(m => m.default);
      const nftResult = await blockchainService.createProduct(
        product.name,
        productData.manufacturer || 'Unknown',
        parseFloat(product.price),
        product.description,
        product.attributes
      );

      // 4. Generate hologram data
      const hologramData = await generateHologramData(product, nftResult);

      // 5. Save everything to the backend
      const createResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product,
          nftData: nftResult,
          hologramData
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create product');
      }

      const finalResult = await createResponse.json();

      // Add the transaction to pending list
      dispatch(addPendingTransaction({
        hash: nftResult.transaction.hash,
        type: 'MINT_NFT',
        productId: product.id,
        timestamp: Date.now()
      }));

      return {
        ...finalResult,
        product: {
          ...product,
          images: productData.imageUrls // Use the IPFS URLs consistently
        },
        nftData: nftResult,
        hologramData
      };
    } catch (error) {
      console.error('Product creation failed:', error);
      throw error;
    }
  }
);

export const fetchBlockchainStatus = createAsyncThunk(
  'products/fetchBlockchainStatus',
  async (productId, { getState }) => {
    try {
      const blockchainService = await import('../../services/blockchain').then(m => m.default);
      const [productStatus, nftStatus, supplyChainStatus] = await Promise.all([
        blockchainService.getProduct(productId),
        blockchainService.getNFTStatus(productId),
        blockchainService.getSupplyChainStatus(productId)
      ]);

      return {
        productId,
        status: productStatus,
        nft: nftStatus,
        supplyChain: supplyChainStatus,
        lastUpdated: Date.now()
      };
    } catch (error) {
      throw error;
    }
  }
);

export const updateProductShipment = createAsyncThunk(
  'products/updateShipment',
  async ({ productId, stage, location }, { getState }) => {
    try {
      const blockchainService = await import('../../services/blockchain').then(m => m.default);
      const txHash = await blockchainService.updateShipmentStatus(productId, stage, location);
      return { productId, stage, location, txHash };
    } catch (error) {
      throw error;
    }
  }
);

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { dispatch }) => {
    // Simulate API call - replace with real API in production
    const products = await new Promise((resolve) => {
      setTimeout(() => resolve(initialProducts), 1000);
    });

    // Fetch blockchain status for each product
    products.forEach(product => {
      dispatch(fetchBlockchainStatus(product.id));
    });

    return products;
  }
);

// Slice definition
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setBlockchainStatus: (state, action) => {
      const { productId, status } = action.payload;
      state.blockchainStatus[productId] = status;
    },
    setSupplyChainStatus: (state, action) => {
      const { productId, status } = action.payload;
      state.supplyChainStatus[productId] = status;
    },
    addPendingTransaction: (state, action) => {
      state.pendingTransactions.push(action.payload);
    },
    removePendingTransaction: (state, action) => {
      state.pendingTransactions = state.pendingTransactions.filter(
        tx => tx.hash !== action.payload
      );
    },
    setCategory: (state, action) => {
      state.currentCategory = action.payload;
      if (action.payload === 'all') {
        state.filteredItems = state.items;
      } else {
        state.filteredItems = state.items.filter(
          item => item.category === action.payload
        );
      }
    },
    sortProducts: (state, action) => {
      state.sortBy = action.payload;
      const sortProducts = [...state.filteredItems];
      
      switch (action.payload) {
        case 'name':
          sortProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'price-low':
          sortProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          sortProducts.sort((a, b) => b.price - a.price);
          break;
        default:
          break;
      }
      
      state.filteredItems = sortProducts;
    },
    updateStock: (state, action) => {
      const { productId, quantity } = action.payload;
      const product = state.items.find(item => item.id === productId);
      if (product) {
        product.stock = Math.max(0, product.stock - quantity);
      }
    },
    setProductStatus: (state, action) => {
      const { productId, status } = action.payload;
      const product = state.items.find(item => item.id === productId);
      if (product) {
        product.status = status;
      }
    },
    updateProductDetails: (state, action) => {
      const { productId, updates } = action.payload;
      const product = state.items.find(item => item.id === productId);
      if (product) {
        Object.assign(product, updates);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.filteredItems = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createProductWithNFT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductWithNFT.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.product);
        state.filteredItems = state.currentCategory === 'all' 
          ? state.items 
          : state.items.filter(item => item.category === state.currentCategory);
        state.blockchainStatus[action.payload.product.id] = action.payload.nftData;
        state.supplyChainStatus[action.payload.product.id] = {
          stage: 'created',
          timestamp: Date.now()
        };
      })
      .addCase(createProductWithNFT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

// Export actions
export const {
  setCategory,
  sortProducts,
  updateStock,
  setBlockchainStatus,
  setSupplyChainStatus,
  addPendingTransaction,
  removePendingTransaction,
  setProductStatus,
  updateProductDetails
} = productsSlice.actions;

// Export selectors
export const selectBlockchainStatus = (state, productId) =>
  state.products.blockchainStatus[productId];
export const selectSupplyChainStatus = (state, productId) =>
  state.products.supplyChainStatus[productId];
export const selectPendingTransactions = (state) =>
  state.products.pendingTransactions;
export const selectProductById = (state, productId) =>
  state.products.items.find(item => item.id === productId);
export const selectProductNFTStatus = (state, productId) =>
  state.products.blockchainStatus[productId]?.nft || null;
export const selectProductHologramData = (state, productId) =>
  state.products.blockchainStatus[productId]?.hologram || null;

export default productsSlice.reducer;