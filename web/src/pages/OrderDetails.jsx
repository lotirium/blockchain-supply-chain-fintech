import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { generateOrderQR, getOrderQRStatus } from '../services/qrcode';
import { getOrderById, getOrderStatusHistory, updateOrderStatus } from '../services/orders';
import OrderLabels from '../components/OrderLabels';
import OrderStatusControl from '../components/OrderStatusControl';
import OrderStatusHistory from '../components/OrderStatusHistory';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3001';

const OrderQRCodeSection = ({ order, onQRGenerated }) => {
  const [qrCode, setQrCode] = useState(null);
  const [hologramPath, setHologramPath] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [labelsGenerated, setLabelsGenerated] = useState(false);

  // Load saved label data from session storage on component mount
  useEffect(() => {
    const savedLabelsGenerated = sessionStorage.getItem(`order_${order.id}_labels_generated`);
    const savedQrCode = sessionStorage.getItem(`order_${order.id}_qr_code`);
    const savedHologramPath = sessionStorage.getItem(`order_${order.id}_hologram_path`);
    const savedTokenId = sessionStorage.getItem(`order_${order.id}_token_id`);
    
    if (savedLabelsGenerated === 'true') {
      setLabelsGenerated(true);
      
      if (savedQrCode) setQrCode(savedQrCode);
      if (savedHologramPath) setHologramPath(savedHologramPath);
      if (savedTokenId) setTokenId(savedTokenId);
    }
  }, [order.id]);

  // Load existing QR code and hologram data when component mounts or order status changes
  useEffect(() => {
    if (order.qr_status === 'active') {
      setLoading(true);
      getOrderQRStatus(order.id)
        .then(response => {
          if (response.success) {
            const { qrCode: newQrCode, tokenId: newTokenId, hologramPath: newHologramPath } = response.data;
            
            // Set data from response if available
            if (newQrCode) {
              setQrCode(newQrCode);
              sessionStorage.setItem(`order_${order.id}_qr_code`, newQrCode);
            }
            
            if (newTokenId) {
              setTokenId(newTokenId);
              sessionStorage.setItem(`order_${order.id}_token_id`, newTokenId);
            }
            
            if (newHologramPath) {
              setHologramPath(newHologramPath);
              sessionStorage.setItem(`order_${order.id}_hologram_path`, newHologramPath);
            }
            
            // Mark labels as generated if we have either QR code or hologram
            if (newQrCode || newHologramPath) {
              setLabelsGenerated(true);
              sessionStorage.setItem(`order_${order.id}_labels_generated`, 'true');
            }
          }
        })
        .catch(err => {
          console.error('Error fetching QR code:', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [order.id, order.qr_status]);

  const handleGenerateLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate QR code and hologram
      const response = await generateOrderQR(order.id);

      if (response.success && response.data) {
        const { qrCode: newQrCode, hologramPath: newHologramPath, tokenId: newTokenId } = response.data;
        
        // Set all states at once to prevent partial renders
        setQrCode(newQrCode);
        setHologramPath(newHologramPath);
        setTokenId(newTokenId);
        setLabelsGenerated(true);
        onQRGenerated?.();
      } else {
        throw new Error(response.message || 'Failed to generate labels');
      }
    } catch (err) {
      setError(err.message);
      // Keep previous labels if they exist on error
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

  // We don't restrict component visibility based on status anymore
  // Instead, we'll only control the visibility of the generation button

  // Save generated labels data to session storage
  useEffect(() => {
    if (labelsGenerated) {
      sessionStorage.setItem(`order_${order.id}_labels_generated`, 'true');
      
      if (qrCode) {
        sessionStorage.setItem(`order_${order.id}_qr_code`, qrCode);
      }
      
      if (hologramPath) {
        sessionStorage.setItem(`order_${order.id}_hologram_path`, hologramPath);
      }
      
      if (tokenId) {
        sessionStorage.setItem(`order_${order.id}_token_id`, tokenId);
      }
    }
  }, [labelsGenerated, qrCode, hologramPath, tokenId, order.id]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h4 className="font-medium text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
            <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3z" />
          </svg>
          Product Authentication Labels
        </h4>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {/* Always show labels if they've been generated, regardless of order status */}
        {labelsGenerated ? (
          <OrderLabels
            qrCode={qrCode}
            hologramPath={hologramPath}
            tokenId={tokenId}
            onDownloadQR={handleDownloadQR}
          />
        ) : (
          <>
            <div className="text-center max-w-lg mx-auto mb-6">
              <p className="text-gray-600 mb-4">
                Generate product authentication labels to allow customers to verify the authenticity of the product. 
                This will create a QR code and UV hologram that can be printed and attached to the product packaging.
              </p>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Generating labels...</span>
                </div>
              ) : (
                /* Only show generation button for appropriate statuses */
                ['confirmed', 'packed'].includes(order.status) && (
                  <button
                    onClick={handleGenerateLabels}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md hover:shadow-lg"
                  >
                    Generate Authentication Labels
                  </button>
                )
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">What are authentication labels?</p>
                  <p>The QR code allows customers to verify product authenticity by scanning with their phone. The UV hologram provides an additional layer of security with a hidden token that can only be seen under UV light.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
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
  const statuses = [
    { key: 'pending', label: 'Order Placed', icon: 
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg> 
    },
    { key: 'confirmed', label: 'Confirmed', icon: 
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg> 
    },
    { key: 'packed', label: 'Packed', icon: 
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
      </svg> 
    },
    { key: 'shipped', label: 'Shipped', icon: 
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2a1 1 0 00.9-.5l3-5A1 1 0 0016 3H4a1 1 0 00-1 1z" />
      </svg> 
    },
    { key: 'delivered', label: 'Delivered', icon: 
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
      </svg> 
    }
  ];
  
  const currentIndex = statuses.findIndex(s => s.key === currentStatus);
  
  return (
    <div className="py-4 space-y-6">
      {statuses.map((status, index) => {
        const isActive = index <= currentIndex && currentIndex !== -1;
        const isCurrent = status.key === currentStatus;
        
        return (
          <div key={status.key} className={`flex items-center ${index < statuses.length - 1 ? 'pb-6 border-l-2 border-dashed ml-3' : ''} ${isActive ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className={`-ml-3 ${index < statuses.length - 1 ? 'mb-auto' : ''}`}>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full 
                ${isCurrent ? 'bg-blue-600 animate-pulse' : isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
                <span className="text-white">
                  {status.icon}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isActive ? 'text-black' : 'text-gray-500'}`}>
                {status.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-gray-500 mt-1">Current status</p>
              )}
            </div>
            {isCurrent && (
              <div className="ml-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const OrderDetails = () => {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusStack, setStatusStack] = useState([]);
  const user = useSelector(state => state.auth.user);
  const role = user?.role;
  const navigate = useNavigate();

  const fetchOrderAndHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order details and status history in parallel
      const [orderData, historyData] = await Promise.all([
        getOrderById(orderId),
        getOrderStatusHistory(orderId)
      ]);

      setOrder(orderData);
      setStatusHistory(historyData);
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndHistory();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setError(null);
      // Add current status to stack before updating
      setStatusStack(prev => [...prev, order.status]);
      // Update status in backend
      await updateOrderStatus(orderId, newStatus);
      // Refresh data
      await fetchOrderAndHistory();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    }
  };

  const handleUndo = async () => {
    if (statusStack.length === 0) return;

    try {
      setError(null);
      // Get last status from stack
      const previousStatus = statusStack[statusStack.length - 1];
      // Update the status
      await updateOrderStatus(orderId, previousStatus);
      // Remove the last status from stack
      setStatusStack(prev => prev.slice(0, -1));
      // Refresh data
      await fetchOrderAndHistory();
    } catch (err) {
      console.error('Error undoing status:', err);
      setError(err.message || 'Failed to undo status');
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
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header with back button and status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <button
              onClick={() => navigate('/orders')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Back to orders"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-2xl font-light text-gray-900">Order <span className="font-bold text-black">#{order.id.slice(0, 8)}</span></h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Order progress section */}
        <section className="mb-16">
          <div className="border-b border-gray-200 pb-3 mb-8">
            <h2 className="text-lg text-gray-900 font-medium">Order Progress</h2>
          </div>
          
          <div className="mb-10 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-medium text-gray-900">Order Timeline</h3>
            </div>
            <div className="p-6 bg-white">
              <OrderStatusTimeline currentStatus={order.status} />
            </div>
          </div>
          
          {(role === 'admin' || role === 'seller') && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Update Order Status
                </h3>
              </div>
              <div className="p-6 bg-white">
                <OrderStatusControl
                  currentStatus={order.status}
                  onStatusUpdate={handleStatusUpdate}
                  onUndo={handleUndo}
                  qrGenerated={order.qr_status === 'active'}
                  orderId={order.id}
                />
                
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                  <p>Changes to order status will be recorded in the order history and visible to customers.</p>
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Order summary section */}
        <section className="mb-16">
          <div className="border-b border-gray-200 pb-3 mb-8">
            <h2 className="text-lg text-gray-900 font-medium">Order Summary</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Order info */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Order Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500">Order Date</dt>
                  <dd className="text-sm text-gray-900">{new Date(order.created_at || Date.now()).toLocaleDateString()}</dd>
                </div>
                {order.merchantStore && (
                  <div>
                    <dt className="text-xs text-gray-500">Store</dt>
                    <dd className="text-sm text-gray-900">{order.merchantStore.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-500">Total Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">${order.total_fiat_amount}</dd>
                </div>
              </dl>
            </div>
            
            {/* Payment info */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Payment Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500">Payment Method</dt>
                  <dd className="text-sm text-gray-900 capitalize">{order.payment_method}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Payment Status</dt>
                  <dd>
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Amount Paid</dt>
                  <dd className="text-sm font-medium text-gray-900">${order.total_fiat_amount}</dd>
                </div>
              </dl>
            </div>
            
            {/* Shipping info */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Shipping Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500">Shipping Method</dt>
                  <dd className="text-sm text-gray-900">{order.shipping_method}</dd>
                </div>
                {order.tracking_number && (
                  <div>
                    <dt className="text-xs text-gray-500">Tracking Number</dt>
                    <dd className="text-xs bg-gray-100 p-2 rounded font-mono break-all">{order.tracking_number}</dd>
                  </div>
                )}
                {order.estimated_delivery_date && (
                  <div>
                    <dt className="text-xs text-gray-500">Estimated Delivery</dt>
                    <dd className="text-sm text-gray-900">{new Date(order.estimated_delivery_date).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>
        
        {/* Order items section */}
        <section className="mb-16">
          <div className="border-b border-gray-200 pb-3 mb-8">
            <h2 className="text-lg text-gray-900 font-medium">Order Items</h2>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map(item => (
                    <tr key={`${item.id}-${item.product?.id || ''}-${item.quantity}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.product?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-500">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">${item.total_price}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="text-base font-semibold text-gray-900">${order.total_fiat_amount}</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Status history section */}
        <section className="mb-16">
          <div className="border-b border-gray-200 pb-3 mb-8">
            <h2 className="text-lg text-gray-900 font-medium">Order History</h2>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Status Timeline
              </h3>
            </div>
            <div className="p-6 bg-white">
              <OrderStatusHistory history={statusHistory} />
              
              {statusHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No status history available for this order.</p>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* QR Code section for sellers */}
        {role === 'seller' && (
          <section className="mb-10">
            <div className="border-b border-gray-200 pb-3 mb-8">
              <h2 className="text-lg text-gray-900 font-medium">Product Labels</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <OrderQRCodeSection
                order={order}
                onQRGenerated={() => {
                  setOrder(prev => ({ ...prev, qr_status: 'active' }));
                }}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
