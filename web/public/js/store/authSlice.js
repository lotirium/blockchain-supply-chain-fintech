const { createSlice, createAsyncThunk } = RTK;

// Simulated auth functions
const fakeAuth = {
  login: (credentials) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email === 'test@example.com' && credentials.password === 'password') {
          resolve({
            id: 1,
            email: credentials.email,
            name: 'Test User',
            token: 'fake-jwt-token'
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    }),
  logout: () =>
    new Promise((resolve) => {
      setTimeout(resolve, 500);
    })
};

const login = createAsyncThunk(
  'auth/login',
  async (credentials) => {
    const response = await fakeAuth.login(credentials);
    localStorage.setItem('token', response.token);
    return response;
  }
);

const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await fakeAuth.logout();
    localStorage.removeItem('token');
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout cases
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

const { clearError, updateProfile } = authSlice.actions;
window.authActions = { login, logout, clearError, updateProfile };
window.authReducer = authSlice.reducer;