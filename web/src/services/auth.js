const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export const authService = {
  validateRegistrationData(userData) {
    if (!userData) {
      throw new Error('Registration data is required');
    }

    const { email, password, username, userType, firstName, lastName, store } = userData;

    // Basic validation for all users
    if (!email?.trim()) throw new Error('Email is required');
    if (!password) throw new Error('Password must be at least 8 characters');
    if (!username?.trim()) throw new Error('Username is required');
    if (!firstName?.trim()) throw new Error('First name is required');
    if (!lastName?.trim()) throw new Error('Last name is required');
    if (!userType) throw new Error('User type is required');

    // Keep both userType and role for proper validation
    const role = userType === 'buyer' ? 'user' : 'seller';

    // Validate seller store information
    if (userType === 'seller') {
      if (!store) {
        throw new Error('Store information is required for sellers');
      }
      if (!store.name?.trim()) {
        throw new Error('Store name is required');
      }
      if (!store.businessPhone?.trim()) {
        throw new Error('Business phone is required');
      }
      if (!store.businessAddress?.trim()) {
        throw new Error('Business address is required');
      }
    }

    // Normalize and structure the data
    const normalizedData = {
      email: email.trim(),
      password,
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role, // For database role
      userType, // Original user type for validation
      ...(userType === 'seller' && {
        store: {
          name: store.name.trim(),
          description: store.description?.trim() || '',
          business_email: email.trim(), // Use registration email as store email
          business_phone: store.businessPhone.trim(),
          business_address: store.businessAddress.trim(),
          isVerified: false, // New stores start unverified
          status: 'pending_verification' // New stores start pending verification
        }
      })
    };

    return normalizedData;
  },

  async register(userData, retryCount = 0) {
    console.log('Starting registration process:', { 
      userType: userData.userType,
      email: userData.email
    });
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    try {
      // Validate and normalize the data
      const validatedData = this.validateRegistrationData(userData);

      console.log('Sending validated registration data:', {
        ...validatedData,
        password: '***',
        isSeller: validatedData.role !== 'user'
      });

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        // Handle rate limit error specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 
            Math.pow(2, retryCount + 1);

          const error = await response.json();
          error.retryAfter = retryAfter;
          throw error;
        }

        const error = await response.json();
        console.error('Registration failed:', error);
        // Handle specific error for duplicate email
        if (error.message === 'Email already registered') {
          throw new Error('This email is already registered. Please use a different email address or try logging in.');
        }
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', { 
        userId: data.user?.id, 
        hasToken: !!data.token,
        role: data.user?.role,
        storeStatus: data.user?.store?.status
      });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      if (retryCount < MAX_RETRIES && (
        error.message === 'Failed to fetch' || 
        error.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
        error.message.includes('ERR_RATE_LIMIT_EXCEEDED') ||
        error.status === 429
      )) {
        const delay = error.retryAfter ? 
          error.retryAfter * 1000 :
          Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 10000);

        console.log(`Rate limit hit, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.register(userData, retryCount + 1);
      }
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(credentials, retryCount = 0) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // Handle rate limit error specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 
            Math.pow(2, retryCount + 1);

          const error = await response.json();
          error.retryAfter = retryAfter;
          throw error;
        }

        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return data;
    } catch (error) {
      if (retryCount < MAX_RETRIES && (
        error.message === 'Failed to fetch' || 
        error.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
        error.message.includes('ERR_RATE_LIMIT_EXCEEDED') ||
        error.status === 429
      )) {
        const delay = error.retryAfter ? 
          error.retryAfter * 1000 :
          Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 10000);

        console.log(`Rate limit hit, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.login(credentials, retryCount + 1);
      }
      throw error;
    }
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  },

  async getProfile(retryCount = 0) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please login again.');
        }

        // Handle rate limit error specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 
            Math.pow(2, retryCount + 1); // Exponential backoff if no Retry-After header

          const error = await response.json();
          error.retryAfter = retryAfter;
          throw error;
        }

        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch profile');
      }

      return response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES && (
        error.message === 'Failed to fetch' || 
        error.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
        error.message.includes('ERR_RATE_LIMIT_EXCEEDED') ||
        error.status === 429
      )) {
        // Use Retry-After header value if available, otherwise use exponential backoff
        const delay = error.retryAfter ? 
          error.retryAfter * 1000 : // Convert to milliseconds
          Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 10000);

        console.log(`Rate limit hit, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getProfile(retryCount + 1);
      }
      throw error;
    }
  },

  async updateProfile(userData, retryCount = 0) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please login again.');
        }

        // Handle rate limit error specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 
            Math.pow(2, retryCount + 1); // Exponential backoff if no Retry-After header

          const error = await response.json();
          error.retryAfter = retryAfter;
          throw error;
        }

        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      return response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES && (
        error.message === 'Failed to fetch' || 
        error.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
        error.message.includes('ERR_RATE_LIMIT_EXCEEDED') ||
        error.status === 429
      )) {
        // Use Retry-After header value if available, otherwise use exponential backoff
        const delay = error.retryAfter ? 
          error.retryAfter * 1000 : // Convert to milliseconds
          Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 10000);

        console.log(`Rate limit hit, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.updateProfile(userData, retryCount + 1);
      }
      throw error;
    }
  },

  async updateStore(storeData, retryCount = 0) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate required store fields
      if (!storeData.name?.trim()) {
        throw new Error('Store name is required');
      }
      if (!storeData.business_phone?.trim()) {
        throw new Error('Business phone is required');
      }
      if (!storeData.business_address?.trim()) {
        throw new Error('Business address is required');
      }

      // Normalize store data
      const normalizedStoreData = {
        ...storeData,
        name: storeData.name.trim(),
        description: storeData.description?.trim() || '',
        business_email: storeData.business_email?.trim() || '',
        business_phone: storeData.business_phone.trim(),
        business_address: storeData.business_address.trim()
      };

      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ store: normalizedStoreData }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please login again.');
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 
            Math.pow(2, retryCount + 1);

          const error = await response.json();
          error.retryAfter = retryAfter;
          throw error;
        }

        const error = await response.json();
        throw new Error(error.message || 'Failed to update store information');
      }

      return response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES && (
        error.message === 'Failed to fetch' || 
        error.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
        error.message.includes('ERR_RATE_LIMIT_EXCEEDED') ||
        error.status === 429
      )) {
        const delay = error.retryAfter ? 
          error.retryAfter * 1000 :
          Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 10000);

        console.log(`Rate limit hit, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.updateStore(storeData, retryCount + 1);
      }
      throw error;
    }
  },
};