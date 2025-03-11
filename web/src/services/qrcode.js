const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3001';

export const generateOrderQR = async (orderId) => {
  try {
    const response = await fetch(`${API_URL}/api/qrcode/order/${orderId}/generate-labels`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'Failed to generate product labels');
      error.response = { status: response.status, data };
      throw error;
    }

    // Ensure we have both QR code and hologram path
    if (!data.success || !data.data?.qrCode || !data.data?.hologramPath) {
      throw new Error('Invalid response format from server');
    }

    return data;
  } catch (error) {
    if (!error.response) {
      console.error('Network error generating product labels:', error);
      error.message = 'Network error - please check your connection';
    }
    throw error;
  }
};

export const verifyOrderQR = async (qrData) => {
  try {
    const response = await fetch(`${API_URL}/api/qrcode/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ qrData })
    });

    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'Failed to verify QR code');
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.response) {
      console.error('Network error verifying QR code:', error);
      error.message = 'Network error - please check your connection';
    }
    throw error;
  }
};

export const getOrderQRStatus = async (orderId) => {
  try {
    const response = await fetch(`${API_URL}/api/qrcode/order/${orderId}/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'Failed to get product labels status');
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.response) {
      console.error('Network error getting product labels status:', error);
      error.message = 'Network error - please check your connection';
    }
    throw error;
  }
};