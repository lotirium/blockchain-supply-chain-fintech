const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Validate store_id exists for all items
  if (!orderData.items?.length) {
    throw new Error('Order must contain items');
  }

  // Validate each item has required fields
  orderData.items.forEach(item => {
    if (!item.product_id) {
      throw new Error('Each item must have a product_id');
    }
    if (!item.store_id) {
      throw new Error('Each item must have a store_id');
    }
    if (!item.quantity || item.quantity < 1) {
      throw new Error('Each item must have a valid quantity');
    }
    if (!item.unit_price || item.unit_price < 0) {
      throw new Error('Each item must have a valid unit price');
    }
  });

  // Validate addresses
  if (!orderData.shipping_address || !orderData.billing_address) {
    throw new Error('Shipping and billing addresses are required');
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