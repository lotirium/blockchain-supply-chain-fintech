const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Validate store_id exists for all items
  if (!orderData.items?.length || orderData.items.some(item => !item.store_id)) {
    throw new Error('All items must have a valid store_id');
  }

  const response = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create order');
  }

  return data;
};

export default {
  createOrder
};