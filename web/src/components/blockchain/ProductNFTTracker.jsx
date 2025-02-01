import React, { useState, useEffect } from 'react';
import { blockchainService } from '../../services/blockchain';

const ProductNFTTracker = () => {
  const [tokenId, setTokenId] = useState('');
  const [product, setProduct] = useState(null);
  const [shipmentHistory, setShipmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const response = await blockchainService.getAllProducts();
      setProducts(response);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load available products. ' + err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleTrack = async () => {
    if (!tokenId) return;
    
    setLoading(true);
    setError(null);
    try {
      const productData = await blockchainService.getProduct(tokenId);
      if (!productData) {
        throw new Error('Product not found');
      }

      setProduct({
        name: productData.name,
        manufacturer: productData.manufacturer,
        manufactureDate: new Date(productData.manufactureDate * 1000).toLocaleString(),
        status: productData.status,
        currentOwner: productData.currentOwner
      });

      const history = await blockchainService.getShipmentHistory(tokenId);
      setShipmentHistory(history.map(shipment => ({
        sender: shipment.sender,
        receiver: shipment.receiver,
        stage: getStageText(shipment.currentStage),
        timestamp: new Date(shipment.timestamp * 1000).toLocaleString(),
        location: shipment.location
      })));
    } catch (error) {
      console.error('Failed to fetch product data:', error);
      let errorMessage = 'Failed to fetch product data. ';
      
      if (error.message.includes('not found')) {
        errorMessage = 'No product found with this Token ID.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Unable to connect to the blockchain network. Please try again.';
      } else if (error.message.includes('contract')) {
        errorMessage = 'Error accessing the blockchain contract. Please check your connection.';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      setProduct(null);
      setShipmentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStageText = (stage) => {
    const stages = [
      'Created',
      'In Production',
      'Manufactured',
      'In Transit',
      'Delivered',
      'For Sale',
      'Sold'
    ];
    return stages[stage] || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Product NFT Tracker</h2>

      {/* Available Products List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Available Products</h3>
        {loadingProducts ? (
          <p className="text-gray-600">Loading available products...</p>
        ) : products.length > 0 ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-md p-3 hover:bg-white cursor-pointer"
                  onClick={() => {
                    if (!product.token_id) {
                      setError('This product has not been minted as an NFT yet.');
                      setProduct(null);
                      setShipmentHistory([]);
                      return;
                    }
                    setTokenId(product.token_id);
                    // Immediately fetch product details when clicked
                    blockchainService.getProduct(product.token_id)
                      .then(productData => {
                        setProduct({
                          name: productData.name,
                          manufacturer: productData.manufacturer,
                          manufactureDate: new Date(productData.manufactureDate * 1000).toLocaleString(),
                          status: productData.status,
                          currentOwner: productData.currentOwner
                        });
                        return blockchainService.getShipmentHistory(product.token_id);
                      })
                      .then(history => {
                        setShipmentHistory(history.map(shipment => ({
                          sender: shipment.sender,
                          receiver: shipment.receiver,
                          stage: getStageText(shipment.currentStage),
                          timestamp: new Date(shipment.timestamp * 1000).toLocaleString(),
                          location: shipment.location
                        })));
                        setError(null);
                      })
                      .catch(error => {
                        console.error('Failed to fetch product data:', error);
                        setError('No product found with this Token ID');
                        setProduct(null);
                        setShipmentHistory([]);
                      });
                  }}
                >
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.manufacturer}</p>
                  <p className="text-sm text-gray-500">Status: {product.status}</p>
                  {product.token_id ? (
                    <p className="text-sm text-blue-600">NFT Token ID: {product.token_id}</p>
                  ) : (
                    <p className="text-sm text-orange-500">Not minted as NFT yet</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No products available</p>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Search Input */}
      <div className="flex gap-4 mb-6">
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter Token ID (number only)"
          className="flex-1 rounded-md border-gray-300 shadow-sm"
          min="0"
          step="1"
          onKeyDown={(e) => {
            // Allow only numbers, backspace, delete, arrow keys
            if (!/[\d\b]/.test(e.key) &&
                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
              e.preventDefault();
            }
          }}
        />
        <button
          onClick={handleTrack}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Track'}
        </button>
      </div>

      {/* Product Details */}
      {product && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Product Details</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Manufacturer</p>
                <p className="font-medium">{product.manufacturer}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium">{product.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Current Owner</p>
                <p className="font-medium truncate" title={product.currentOwner}>
                  {product.currentOwner}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Manufacture Date</p>
                <p className="font-medium">{product.manufactureDate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipment History */}
      {shipmentHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Shipment History</h3>
          <div className="space-y-4">
            {shipmentHistory.map((shipment, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600">From</p>
                    <p className="font-medium truncate" title={shipment.sender}>
                      {shipment.sender}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">To</p>
                    <p className="font-medium truncate" title={shipment.receiver}>
                      {shipment.receiver}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stage</p>
                    <p className="font-medium">{shipment.stage}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-medium">{shipment.location}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Timestamp</p>
                    <p className="font-medium">{shipment.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {tokenId && !loading && !product && (
        <div className="text-center py-4">
          <p className="text-gray-500">No product found with this Token ID</p>
        </div>
      )}
    </div>
  );
};

export default ProductNFTTracker;