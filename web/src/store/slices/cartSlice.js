import { createSlice } from '@reduxjs/toolkit';

// Load cart state from localStorage
const loadCartState = () => {
  try {
    const serializedState = localStorage.getItem('cart');
    if (serializedState === null) {
      return {
        items: [],
        total: 0,
        itemCount: 0,
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return {
      items: [],
      total: 0,
      itemCount: 0,
    };
  }
};

const initialState = loadCartState();

// Save cart state to localStorage
const saveCartState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('cart', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { id, name, price, store_id, quantity = 1, stock } = action.payload;
      
      if (!store_id) {
        throw new Error('store_id is required when adding items to cart');
      }

      const existingItem = state.items.find(item => item.id === id);
      
      if (existingItem) {
        // Calculate new total quantity
        const newQuantity = existingItem.quantity + quantity;
        // Ensure new quantity doesn't exceed stock
        if (newQuantity <= stock) {
          existingItem.quantity = newQuantity;
        }
      } else {
        // Ensure initial quantity doesn't exceed stock
        const initialQuantity = Math.min(quantity, stock);
        state.items.push({
          id,
          name,
          price,
          store_id,
          quantity: initialQuantity
        });
      }
      
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      saveCartState(state);
    },
    removeItem: (state, action) => {
      const { id } = action.payload;
      state.items = state.items.filter(item => item.id !== id);
      
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      saveCartState(state);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        item.quantity = Math.max(0, quantity);
        if (item.quantity === 0) {
          state.items = state.items.filter(item => item.id !== id);
        }
      }
      
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      saveCartState(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      saveCartState(state);
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;