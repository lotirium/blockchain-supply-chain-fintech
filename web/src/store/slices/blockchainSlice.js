import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ethers } from 'ethers';

const initialState = {
  isConnected: false,
  account: null,
  provider: null,
  network: null,
  balance: null,
  error: null,
  loading: false,
  contracts: {
    nft: null,
    marketplace: null
  },
  transactions: [],
  pendingTransactions: []
};

// Async thunks
export const initializeBlockchain = createAsyncThunk(
  'blockchain/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Create ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Get network information
      const network = await provider.getNetwork();

      // Get account balance
      const balance = await provider.getBalance(accounts[0]);

      return {
        account: accounts[0],
        provider,
        network: {
          chainId: network.chainId,
          name: network.name
        },
        balance: ethers.formatEther(balance)
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addTransaction = createAsyncThunk(
  'blockchain/addTransaction',
  async (transaction, { getState, dispatch }) => {
    try {
      const { provider } = getState().blockchain;
      
      // Wait for transaction confirmation
      const receipt = await provider.waitForTransaction(transaction.hash);
      
      return {
        ...transaction,
        receipt,
        confirmed: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        ...transaction,
        error: error.message,
        confirmed: false,
        timestamp: Date.now()
      };
    }
  }
);

// Slice definition
const blockchainSlice = createSlice({
  name: 'blockchain',
  initialState,
  reducers: {
    setAccount: (state, action) => {
      state.account = action.payload;
    },
    setNetwork: (state, action) => {
      state.network = action.payload;
    },
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addPendingTransaction: (state, action) => {
      state.pendingTransactions.push(action.payload);
    },
    removePendingTransaction: (state, action) => {
      state.pendingTransactions = state.pendingTransactions.filter(
        tx => tx.hash !== action.payload
      );
    },
    setContract: (state, action) => {
      const { name, contract } = action.payload;
      state.contracts[name] = contract;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeBlockchain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeBlockchain.fulfilled, (state, action) => {
        state.isConnected = true;
        state.account = action.payload.account;
        state.provider = action.payload.provider;
        state.network = action.payload.network;
        state.balance = action.payload.balance;
        state.loading = false;
      })
      .addCase(initializeBlockchain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.transactions.push(action.payload);
        state.pendingTransactions = state.pendingTransactions.filter(
          tx => tx.hash !== action.payload.hash
        );
      });
  }
});

// Export actions
export const {
  setAccount,
  setNetwork,
  setBalance,
  setError,
  clearError,
  addPendingTransaction,
  removePendingTransaction,
  setContract
} = blockchainSlice.actions;

// Export selectors
export const selectBlockchainState = (state) => state.blockchain;
export const selectAccount = (state) => state.blockchain.account;
export const selectNetwork = (state) => state.blockchain.network;
export const selectBalance = (state) => state.blockchain.balance;
export const selectIsConnected = (state) => state.blockchain.isConnected;
export const selectContract = (name) => (state) => state.blockchain.contracts[name];
export const selectPendingTransactions = (state) => state.blockchain.pendingTransactions;
export const selectTransactions = (state) => state.blockchain.transactions;

export default blockchainSlice.reducer;