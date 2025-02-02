import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth';

// Async thunks
export const updateStore = createAsyncThunk(
  'auth/updateStore',
  async (storeData, { dispatch, rejectWithValue }) => {
    try {
      const response = await authService.updateStore(storeData);
      // Refresh the profile to get the latest data
      await dispatch(getProfile());
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

// Initialize auth state
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch, getState }) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const state = getState().auth;
      // Only fetch profile if we don't have it or it's stale
      if (!state.user || !state.lastProfileFetch || 
          (Date.now() - state.lastProfileFetch) >= state.profileRefreshInterval) {
        const response = await authService.getProfile();
        return {
          data: response,
          fetchTime: Date.now()
        };
      }
      return null;
    } catch (error) {
      // If initialization fails, clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      throw error;
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState().auth;
      const now = Date.now();
      
      // Check if we have fresh profile data
      if (state.user && state.lastProfileFetch && 
          (now - state.lastProfileFetch) < state.profileRefreshInterval) {
        return { 
          data: state.user,
          fromCache: true 
        };
      }

      // Check if there's already a pending profile request
      if (state.profileFetchPending) {
        return {
          data: state.user,
          fromCache: true,
          pendingFetch: true
        };
      }

      const response = await authService.getProfile();
      return {
        data: response,
        fromCache: false,
        fetchTime: now
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  userType: localStorage.getItem('userType'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  registrationSuccess: false,
  lastProfileFetch: null,
  profileRefreshInterval: 5 * 60 * 1000,
  profileFetchPending: false, // Track pending profile requests
  initialized: false // Track if auth has been initialized
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetRegistration: (state) => {
      state.registrationSuccess = false;
      state.error = null;
    },
    setUserType: (state, action) => {
      state.userType = action.payload;
      localStorage.setItem('userType', action.payload);
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userType = action.payload.user.role === 'user' ? 'buyer' : 'seller';
        state.isAuthenticated = true;
        state.registrationSuccess = true;
        state.error = null;
        state.lastProfileFetch = Date.now(); // Add this to prevent immediate profile fetch
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('userType', state.userType);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.registrationSuccess = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.userType = null;
        state.lastProfileFetch = null;
      })

    // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userType = action.payload.user.role === 'user' ? 'buyer' : 'seller';
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('userType', state.userType);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })

    // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload.data;
          state.userType = action.payload.data.role;
          state.lastProfileFetch = action.payload.fetchTime;
        }
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.token = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

    // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.profileFetchPending = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profileFetchPending = false;
        // Only update if data is not from cache and not from a pending fetch
        if (!action.payload.fromCache && !action.payload.pendingFetch) {
          state.user = action.payload.data;
          state.userType = action.payload.data.role;
          state.lastProfileFetch = action.payload.fetchTime;
        }
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.profileFetchPending = false;
        state.error = action.payload;
      })

      // Update Store
      .addCase(updateStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStore.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.store = action.payload;
        }
        state.error = null;
      })
      .addCase(updateStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetRegistration } = authSlice.actions;

export default authSlice.reducer;