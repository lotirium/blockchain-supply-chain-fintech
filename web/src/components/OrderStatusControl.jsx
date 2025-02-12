import React, { useState } from 'react';
import { updateOrderStatus } from '../services/orders';

const OrderStatusControl = ({ currentStatus, onStatusUpdate, onUndo, qrGenerated, orderId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusFlow = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded', 'cancelled'],
    cancelled: [],
    refunded: ['cancelled']
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      setError(null);
      await updateOrderStatus(orderId, newStatus);
      onStatusUpdate(newStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    try {
      setLoading(true);
      setError(null);
      await onUndo();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get button style based on status
  const getButtonStyle = (status) => {
    const styles = {
      default: 'inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ',
      confirmed: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
      packed: 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700',
      shipped: 'border-purple-600 bg-purple-600 text-white hover:bg-purple-700',
      delivered: 'border-green-600 bg-green-600 text-white hover:bg-green-700',
      cancelled: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
      refunded: 'border-gray-600 bg-gray-600 text-white hover:bg-gray-700',
      undo: 'border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700'
    };

    return `${styles.default} ${styles[status] || styles.confirmed}`;
  };

  // Get available next statuses
  const nextStatuses = statusFlow[currentStatus] || [];

  // Always show undo button except for new orders
  const showUndo = currentStatus !== 'pending';

  // Don't show controls for final statuses except undo
  if (['cancelled', 'refunded'].includes(currentStatus)) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        {showUndo && (
          <button
            onClick={handleUndo}
            disabled={loading}
            className={`${getButtonStyle('undo')} mr-2`}
          >
            {loading ? 'Processing...' : 'Undo Last Change'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map(status => {
          return (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={loading}
              className={getButtonStyle(status)}
            >
              {loading ? 'Processing...' : `Mark as ${status}`}
            </button>
          );
        })}
        {showUndo && (
          <button
            onClick={handleUndo}
            disabled={loading}
            className={`${getButtonStyle('undo')} ml-auto`}
          >
            {loading ? 'Processing...' : 'Undo Last Change'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderStatusControl;