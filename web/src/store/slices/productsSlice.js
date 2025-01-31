import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  filteredItems: [],
  categories: ['all', 'electronics', 'sports', 'fashion', 'home'],
  currentCategory: 'all',
  sortBy: 'name',
  loading: false,
  error: null
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      const response = await fetch(`${API_URL}/api/products`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch products');
      }

      const products = await response.json();
      return products;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async ({ formData }, { rejectWithValue, signal }) => {
    console.log('Starting createProduct thunk...');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      console.log('Using API URL:', API_URL);
      
      if (!API_URL) {
        console.error('API URL not configured');
        return rejectWithValue('API URL is not configured');
      }

      const controller = new AbortController();
      signal.addEventListener('abort', () => {
        console.log('Request aborted');
        controller.abort();
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Sending request to create product...', {
        url: `${API_URL}/api/products`,
        formDataFields: [...formData.entries()].map(([key, value]) => key)
      });
      
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);
      // Don't set Content-Type header when sending FormData
      
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        body: formData,
        headers: headers,
        credentials: 'include',
        signal: controller.signal
      });
      console.log('Received response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server returned error:', response.status, errorText);
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || 'Failed to create product';
        } catch (e) {
          errorMessage = errorText || `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: Expected JSON');
      }

      const data = await response.json();
      console.log('Parsed response data:', data);

      // Handle different response formats
      const product = data.product || data;
      if (!product || typeof product !== 'object') {
        throw new Error('Invalid product data received from server');
      }

      console.log('Product created successfully:', product);
      return { product };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      console.error('Product creation failed:', error);
      return rejectWithValue(error.message || 'Failed to create product');
    }
  }
);

// Slice definition
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {

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
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        const newProduct = action.payload.product;
        
        // Ensure we have a valid product object
        if (newProduct && typeof newProduct === 'object') {
          // Add to items array
          state.items.push(newProduct);
          
          // Update filtered items based on current category
          if (state.currentCategory === 'all' || 
              state.currentCategory === newProduct.category) {
            state.filteredItems.push(newProduct);
          }
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

// Export actions
export const {
  setCategory,
  sortProducts,
  updateStock,
  setProductStatus,
  updateProductDetails
} = productsSlice.actions;

// Memoized Selectors
export const selectProducts = state => state.products.items;
export const selectFilteredProducts = state => state.products.filteredItems;
export const selectCurrentCategory = state => state.products.currentCategory;
export const selectSortBy = state => state.products.sortBy;
export const selectLoading = state => state.products.loading;
export const selectError = state => state.products.error;

export const selectProductById = createSelector(
  [selectProducts, (state, productId) => productId],
  (products, productId) => products.find(item => item.id === productId)
);

export const selectFilteredAndSortedProducts = createSelector(
  [selectProducts, selectCurrentCategory, selectSortBy],
  (products, category, sortBy) => {
    let filteredProducts = category === 'all' 
      ? products 
      : products.filter(item => item.category === category);

    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }
);

export default productsSlice.reducer;