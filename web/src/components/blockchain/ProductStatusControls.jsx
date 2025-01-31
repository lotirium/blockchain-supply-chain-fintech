import React, { useState } from 'react';
import { blockchainService } from '../../services/blockchain';

const ProductStatusControls = ({ productId, currentStatus, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const statuses = [
    'Created',
    'Packed',
    'Shipped',
    'In Transit',
    'Delivered',
    'For Sale',
    'Sold'
  ];

  const handleStatusUpdate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await blockchainService.updateProductStatus(productId, newStatus);
      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'Created':
        return 'bg-gray-500';
      case 'Packed':
        return 'bg-yellow-500';
      case 'Shipped':
        return 'bg-blue-500';
      case 'In Transit':
        return 'bg-purple-500';
      case 'Delivered':
        return 'bg-green-500';
      case 'For Sale':
        return 'bg-indigo-500';
      case 'Sold':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Product Status Controls</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-gray-600">Current Status</p>
        <div className="flex items-center mt-1">
          <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColorClass(currentStatus)}`} />
          <p className="font-medium">{currentStatus}</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Update Status</label>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          disabled={isLoading}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleStatusUpdate}
          disabled={isLoading || currentStatus === newStatus}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Updating...' : 'Update Status'}
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Status Flow</h3>
        <div className="flex items-center space-x-2 overflow-x-auto py-2">
          {statuses.map((status, index) => (
            <React.Fragment key={status}>
              {index > 0 && <div className="text-gray-400">→</div>}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColorClass(status)}`} />
                <span className="text-sm whitespace-nowrap">{status}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductStatusControls;