import React from 'react';

const OrderStatusControl = ({ currentStatus, onStatusUpdate, qrGenerated, allowUndo = true }) => {
  // Previous status mapping for undo
  const previousStatus = {
    confirmed: 'pending',
    packed: 'confirmed',
    shipped: 'packed',
    delivered: 'shipped',
    cancelled: currentStatus,
    refunded: 'delivered'
  };

  // Define valid status transitions
  const statusTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: []
  };

  // Get available next statuses based on current status and QR status
  let availableTransitions = statusTransitions[currentStatus] || [];
  
  // Prevent packed status if QR is not generated
  if (!qrGenerated && currentStatus === 'confirmed') {
    availableTransitions = availableTransitions.filter(status => status !== 'packed');
  }

  const handleUndo = () => {
    const prevStatus = previousStatus[currentStatus];
    if (prevStatus) {
      onStatusUpdate(prevStatus);
    }
  };

  // Define status descriptions
  const statusInfo = {
    confirmed: {
      description: 'Order has been confirmed and payment verified',
      action: 'Confirm Order'
    },
    packed: {
      description: 'Products have been packaged and ready for shipping',
      action: 'Mark as Packed'
    },
    shipped: {
      description: 'Order has been handed over to shipping carrier',
      action: 'Mark as Shipped'
    },
    delivered: {
      description: 'Order has been delivered to the customer',
      action: 'Mark as Delivered'
    },
    cancelled: {
      description: 'Order has been cancelled',
      action: 'Cancel Order'
    },
    refunded: {
      description: 'Order has been refunded',
      action: 'Mark as Refunded'
    }
  };

  // Define status colors
  const statusColors = {
    confirmed: 'bg-blue-600 hover:bg-blue-700',
    packed: 'bg-indigo-600 hover:bg-indigo-700',
    shipped: 'bg-purple-600 hover:bg-purple-700',
    delivered: 'bg-green-600 hover:bg-green-700',
    cancelled: 'bg-red-600 hover:bg-red-700',
    refunded: 'bg-gray-600 hover:bg-gray-700'
  };

  if (availableTransitions.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          No further status updates available for {currentStatus} status.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {currentStatus === 'confirmed' && !qrGenerated && (
        <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md text-sm">
          Generate QR code first before marking order as packed
        </div>
      )}
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Available Actions:</h3>
        <div className="flex flex-wrap gap-2">
          {availableTransitions.map(status => (
            <div key={status} className="flex-1 min-w-[200px]">
              <button
                onClick={() => onStatusUpdate(status)}
                className={`w-full px-4 py-2 text-white rounded-md transition-colors ${statusColors[status]}`}
              >
                {statusInfo[status].action}
              </button>
              <p className="mt-1 text-sm text-gray-600">
                {statusInfo[status].description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {allowUndo && currentStatus !== 'pending' && (
        <div className="flex justify-end">
          <button
            onClick={handleUndo}
            className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo Status Change
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderStatusControl;