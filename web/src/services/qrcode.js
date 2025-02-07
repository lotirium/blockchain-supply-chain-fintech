const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

// Generate QR code for an order after payment confirmation
export const generateOrderQR = async (orderId) => {
  try {
    const response = await fetch(`${API_URL}/api/qrcode/order/${orderId}/generate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'Failed to generate QR code');
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.response) {
      console.error('Network error generating QR code:', error);
      error.message = 'Network error - please check your connection';
    }
    throw error;
  }
};

// Verify a QR code for order authenticity
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
      const error = new Error(data.message || 'Failed to get QR status');
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.response) {
      console.error('Network error getting QR status:', error);
      error.message = 'Network error - please check your connection';
    }
    throw error;
  }
};