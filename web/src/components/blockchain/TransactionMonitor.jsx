import React, { useState, useEffect } from 'react';
import { blockchainService } from '../../services/blockchain';

const TransactionMonitor = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedTx, setExpandedTx] = useState(null);

  useEffect(() => {
    // Initialize event listeners for different transaction types
    blockchainService.addProductEventListener((event) => {
      addTransaction({
        type: 'Product',
        action: 'Created',
        details: {
          productId: event.productId,
          seller: event.seller,
          timestamp: new Date().toISOString()
        }
      });
    });

    blockchainService.addShipmentEventListener((event) => {
      addTransaction({
        type: 'Shipment',
        action: 'Created',
        details: {
          productId: event.productId,
          from: event.sender,
          to: event.receiver,
          timestamp: new Date().toISOString()
        }
      });
    });

    blockchainService.addStageUpdateEventListener((event) => {
      addTransaction({
        type: 'Status',
        action: 'Updated',
        details: {
          productId: event.productId,
          oldStage: event.oldStage,
          newStage: event.newStage,
          timestamp: new Date().toISOString()
        }
      });
    });

    return () => {
      // Cleanup event listeners
      blockchainService.cleanup();
    };
  }, []);

  const addTransaction = (tx) => {
    setTransactions((prev) => [tx, ...prev].slice(0, 50)); // Keep last 50 transactions
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'Product':
        return 'text-green-600';
      case 'Shipment':
        return 'text-blue-600';
      case 'Status':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Product':
        return '🏷️';
      case 'Shipment':
        return '📦';
      case 'Status':
        return '🔄';
      default:
        return '📝';
    }
  };

  const filteredTransactions = transactions.filter(
    (tx) => filter === 'all' || tx.type.toLowerCase() === filter
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Transaction Monitor</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('product')}
            className={`px-3 py-1 rounded-md ${
              filter === 'product'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setFilter('shipment')}
            className={`px-3 py-1 rounded-md ${
              filter === 'shipment'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Shipments
          </button>
          <button
            onClick={() => setFilter('status')}
            className={`px-3 py-1 rounded-md ${
              filter === 'status'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Status Updates
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions to display
          </div>
        ) : (
          filteredTransactions.map((tx, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                expandedTx === index ? 'bg-gray-50' : 'hover:bg-gray-50'
              } cursor-pointer transition-colors`}
              onClick={() => setExpandedTx(expandedTx === index ? null : index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl" role="img" aria-label={tx.type}>
                    {getTransactionIcon(tx.type)}
                  </span>
                  <div>
                    <h3 className={`font-medium ${getActionColor(tx.type)}`}>
                      {tx.type} {tx.action}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(tx.details.timestamp)}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">
                  {expandedTx === index ? '▼' : '▶'}
                </span>
              </div>

              {expandedTx === index && (
                <div className="mt-4 pl-11">
                  <div className="bg-gray-100 rounded-md p-3">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(tx.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionMonitor;