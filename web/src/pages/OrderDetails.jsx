import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { generateOrderQR, getOrderQRStatus } from '../services/qrcode';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

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
    <div className="bg-white shadow rounded-lg p-6">
      <h4 className="font-medium text-gray-700 mb-2">QR Code</h4>
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

const OrderStatusTimeline = ({ currentStatus }) => {
  const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="relative">
      <div className="flex items-center justify-between w-full">
        {statuses.map((status, index) => {
          const isActive = index <= currentIndex && currentIndex !== -1;
          const isCurrentStep = status === currentStatus;

          return (
            <div key={status} className="relative flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-blue-600' : 'bg-gray-200'
                } ${isCurrentStep ? 'ring-4 ring-blue-100' : ''}`}
              >
                <span className="text-white text-sm">{index + 1}</span>
              </div>
              <span className={`mt-2 text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="absolute top-4 left-0 right-0 h-0.5 -translate-y-1/2">
        <div className="h-full bg-gray-200"></div>
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${Math.max(0, (currentIndex / (statuses.length - 1)) * 100)}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

const OrderDetails = () => {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(state => state.auth.user);
  const role = user?.role;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Add small delay to ensure loading state is visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          timeout: 5000 // 5 second timeout
        });
        if (!response.data) {
          throw new Error('No data received from server');
        }
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch order');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Updating order status:', { orderId, newStatus });
      
      const response = await axios.patch(`${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        }
      );

      console.log('Status update response:', response.data);
      
      if (!response.data) {
        throw new Error('No response data from status update');
      }
      
      setOrder(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update order status');
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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <button
          onClick={() => navigate('/orders')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Orders
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Order Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Order ID:</span> #{order.id.slice(0, 8)}</p>
            {order.merchantStore && (
              <p><span className="font-medium">Store:</span> {order.merchantStore.name}</p>
            )}
            <p><span className="font-medium">Total Amount:</span> ${order.total_fiat_amount}</p>
            <p><span className="font-medium">Status:</span> <OrderStatusBadge status={order.status} /></p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Method:</span> {order.payment_method}</p>
            <p><span className="font-medium">Status:</span> {order.payment_status}</p>
            <p><span className="font-medium">Amount:</span> ${order.total_fiat_amount}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Method:</span> {order.shipping_method}</p>
            {order.tracking_number && (
              <p><span className="font-medium">Tracking:</span> {order.tracking_number}</p>
            )}
            {order.estimated_delivery_date && (
              <p>
                <span className="font-medium">Est. Delivery:</span>{' '}
                {new Date(order.estimated_delivery_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-6">Order Status</h2>
        <div className="mb-8">
          <OrderStatusTimeline currentStatus={order.status} />
        </div>
        
        {(role === 'admin' || role === 'seller') && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status:
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={order.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
            >
              {['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'].map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items?.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-medium">{item.product?.name}</span>
                <span className="text-gray-600 ml-2">x{item.quantity}</span>
              </div>
              <span className="text-gray-700">${item.total_price}</span>
            </div>
          ))}
        </div>
      </div>

      {role === 'seller' && (
        <OrderQRCode
          order={order}
          onQRGenerated={() => {
            setOrder(prev => ({ ...prev, qr_status: 'active' }));
          }}
        />
      )}
    </div>
  );
};

export default OrderDetails;