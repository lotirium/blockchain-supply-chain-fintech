const { createSlice, createAsyncThunk } = RTK;

// Simulated product data
const initialProducts = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 99.99,
    category: 'electronics',
    description: 'High-quality wireless headphones with noise cancellation',
    image: '/images/headphones.jpg',
    stock: 15
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 199.99,
    category: 'electronics',
    description: 'Feature-rich smartwatch with health tracking',
    image: '/images/smartwatch.jpg',
    stock: 10
  },
  {
    id: 3,
    name: 'Running Shoes',
    price: 79.99,
    category: 'sports',
    description: 'Comfortable running shoes for all terrains',
    image: '/images/shoes.jpg',
    stock: 20
  }
];

const initialState = {
  items: initialProducts,
  filteredItems: initialProducts,
  categories: ['all', 'electronics', 'sports'],
  currentCategory: 'all',
  sortBy: 'name',
  loading: false,
  error: null
};

const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(initialProducts), 1000);
    });
  }
);

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
      });
  }
});

const { setCategory, sortProducts, updateStock } = productsSlice.actions;
window.productsActions = { setCategory, sortProducts, updateStock, fetchProducts };
window.productsReducer = productsSlice.reducer;