const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.4:3001';
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

const handleRequest = async (url, options, retryCount = 0) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Don't set Content-Type for FormData
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...(!(options.body instanceof FormData) && {
        'Content-Type': 'application/json'
      }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
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
      throw new Error(error.message || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
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

      console.log(`Request failed, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return handleRequest(url, options, retryCount + 1);
    }
    throw error;
  }
};

export const getDashboardData = async () => {
  return handleRequest(`${API_URL}/api/seller/dashboard/data`, {
    method: 'GET'
  });
};

export const getStoreStats = async (dateRange) => {
  const params = new URLSearchParams();
  if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
  if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

  return handleRequest(`${API_URL}/api/seller/dashboard/stats?${params}`, {
    method: 'GET'
  });
};

export const getNotifications = async (page = 1, limit = 20, type, read) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  if (type) params.append('type', type);
  if (read !== undefined) params.append('read', read.toString());

  return handleRequest(`${API_URL}/api/seller/dashboard/notifications?${params}`, {
    method: 'GET'
  });
};

export const markNotificationRead = async (notificationId) => {
  return handleRequest(`${API_URL}/api/seller/dashboard/notifications/${notificationId}/read`, {
    method: 'PUT'
  });
};

export const markAllNotificationsRead = async () => {
  return handleRequest(`${API_URL}/api/seller/dashboard/notifications/read-all`, {
    method: 'PUT'
  });
};

export const deleteNotification = async (notificationId) => {
  return handleRequest(`${API_URL}/api/seller/dashboard/notifications/${notificationId}`, {
    method: 'DELETE'
  });
};

export const getStore = async () => {
  return handleRequest(`${API_URL}/api/seller/store`, {
    method: 'GET'
  });
};

export default {
  getDashboardData,
  getStoreStats,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getStore
};