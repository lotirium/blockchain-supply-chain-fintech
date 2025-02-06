import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { generateOrderQR, getOrderQRStatus } from '../services/qrcode';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

// QR Code component for orders
const OrderQRCode = ({ order, onQRGenerated }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order.qr_status === 'active') {
      getOrderQRStatus(order.id)
        .then(response => {
          if (response.success && response.data.qrCode) {
            setQrCode(response.data.qrCode);
          }
        })
        .catch(console.error);
    }
  }, [order.id, order.qr_status]);

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await generateOrderQR(order.id);
      if (response.success) {
        setQrCode(response.data.qrCode);
        onQRGenerated?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `order-${order.id.slice(0, 8)}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!['confirmed', 'packed'].includes(order.status)) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-medium text-gray-700 mb-2">QR Code:</h4>
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      {qrCode ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={qrCode}
              alt="Order QR Code"
              className="w-48 h-48 border p-2"
            />
          </div>
          <button
            onClick={handleDownloadQR}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Download QR Code
          </button>
        </div>
      ) : (
        <button
          onClick={handleGenerateQR}
          disabled={loading}
          className={`w-full px-4 py-2 rounded text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      )}
      <p className="mt-2 text-sm text-gray-600">
        Generate and attach this QR code to the product package before shipping.
      </p>
    </div>
  );
};

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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.patch(`${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        }
      );
      
      // Refresh orders after update
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

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

  const statusOptions = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];

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
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Order #{order.id.slice(0, 8)}
                    {order.merchantStore && ` - ${order.merchantStore.name}`}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                    {order.orderPlacer && ` - ${order.orderPlacer.first_name} ${order.orderPlacer.last_name}`}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-700">Payment</h4>
                  <p>Method: {order.payment_method}</p>
                  <p>Status: {order.payment_status}</p>
                  <p>Amount: ${order.total_fiat_amount}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Shipping</h4>
                  <p>Method: {order.shipping_method}</p>
                  {order.tracking_number && (
                    <p>Tracking: {order.tracking_number}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Delivery</h4>
                  <p>Status: {order.status}</p>
                  {order.estimated_delivery_date && (
                    <p>Est. Delivery: {new Date(order.estimated_delivery_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Order Items:</h4>
                <div className="space-y-2">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{item.product?.name}</span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="text-gray-700">${item.total_price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(role === 'admin' || role === 'seller') && (
                <>
                  <div className="mt-4 border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700">Update Status:</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* QR Code Section for Sellers */}
                  {role === 'seller' && (
                    <OrderQRCode 
                      order={order} 
                      onQRGenerated={() => {
                        // Refresh the orders list to get updated QR status
                        const updatedOrders = [...orders];
                        const index = updatedOrders.findIndex(o => o.id === order.id);
                        if (index !== -1) {
                          updatedOrders[index] = { ...order, qr_status: 'active' };
                          setOrders(updatedOrders);
                        }
                      }}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;