const API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

export const getOrders = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/orders/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
  });

  return handleResponse(response);
};

export const getStoreOrders = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/orders/store`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
  });

  return handleResponse(response);
};

export const getOrderById = async (orderId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!orderId) {
    throw new Error('Order ID is required');
  }

  const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
  });

  return handleResponse(response);
};

export const updateOrderStatus = async (orderId, status) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!orderId) {
    throw new Error('Order ID is required');
  }

  if (!status) {
    throw new Error('Status is required');
  }

  const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  return handleResponse(response);
};

export const undoOrderStatus = async (orderId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!orderId) {
    throw new Error('Order ID is required');
  }

  const response = await fetch(`${API_URL}/api/orders/${orderId}/undo-status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
  });

  return handleResponse(response);
};

export const getOrderStatusHistory = async (orderId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!orderId) {
    throw new Error('Order ID is required');
  }

  const response = await fetch(`${API_URL}/api/orders/${orderId}/status-history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
  });

  return handleResponse(response);
};