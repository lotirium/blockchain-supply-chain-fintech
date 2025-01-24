import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import productsReducer from './slices/productsSlice';
import authReducer from './slices/authSlice';
import blockchainReducer from './slices/blockchainSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productsReducer,
    auth: authReducer,
    blockchain: blockchainReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;