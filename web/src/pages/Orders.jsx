import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3001';

const OrderStatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      packed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const OrderListItem = ({ order }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>Order #{order.id.slice(0, 8)}</span>
              {order.merchantStore && <span>- {order.merchantStore.name}</span>}
              <span className="text-gray-600 text-sm">•</span>
              <span className="text-gray-600 text-sm">${order.total_fiat_amount}</span>
              {order.orderPlacer && (
                <>
                  <span className="text-gray-600 text-sm">•</span>
                  <span className="text-gray-600 text-sm">
                    {order.orderPlacer.first_name} {order.orderPlacer.last_name}
                  </span>
                </>
              )}
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <OrderStatusBadge status={order.status} />
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(state => state.auth.user);
  const role = user?.role;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let endpoint = `${API_URL}/api/orders/user`; // default for regular users
        if (role === 'admin') {
          endpoint = `${API_URL}/api/orders`;
        } else if (role === 'seller') {
          endpoint = `${API_URL}/api/orders/store`;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
  
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error details:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [role]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {role === 'admin' ? 'All Orders' : role === 'seller' ? 'Store Orders' : 'My Orders'}
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderListItem
              key={order.id}
              order={order}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;