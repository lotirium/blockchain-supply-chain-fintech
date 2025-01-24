const { configureStore } = RTK;

const store = configureStore({
  reducer: {
    cart: window.cartReducer,
    products: window.productsReducer,
    auth: window.authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Make store available globally
window.store = store;

// Initialize products
store.dispatch(window.productsActions.fetchProducts());