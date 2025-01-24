import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, setCategory, sortProducts } from '../store/slices/productsSlice';
import { addItem } from '../store/slices/cartSlice';
import blockchainService from '../services/blockchain';

function Products() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [blockchainError, setBlockchainError] = useState(null);
  const [nftStatus, setNftStatus] = useState({});
  const [supplyChainStatus, setSupplyChainStatus] = useState({});
  const { filteredItems, loading, categories, currentCategory, sortBy } = useSelector(
    (state) => state.products
  );

  // Initialize blockchain connection
  useEffect(() => {
    const initializeBlockchain = async () => {
      try {
        await blockchainService.initialize();
      } catch (error) {
        console.error('Failed to initialize blockchain:', error);
      }
    };

    initializeBlockchain();
  }, []);

  // Get category from URL params or default to 'all'
  useEffect(() => {
    const category = searchParams.get('category') || 'all';
    dispatch(setCategory(category));
  }, [searchParams, dispatch]);

  // Load NFT and supply chain status for products
  useEffect(() => {
    const loadBlockchainStatus = async () => {
      if (!blockchainService.isInitialized) return;

      try {
        const newNftStatus = {};
        const newSupplyChainStatus = {};

        for (const product of filteredItems) {
          try {
            const productData = await blockchainService.getProduct(product.id);
            newNftStatus[product.id] = {
              verified: true,
              owner: productData.currentOwner,
              manufacturer: productData.manufacturer
            };

            newSupplyChainStatus[product.id] = {
              stage: productData.shipmentStage,
              location: productData.shipmentLocation
            };
          } catch (error) {
            newNftStatus[product.id] = { verified: false };
            newSupplyChainStatus[product.id] = { stage: 0 };
          }
        }

        setNftStatus(newNftStatus);
        setSupplyChainStatus(newSupplyChainStatus);
      } catch (error) {
        console.error('Error loading blockchain status:', error);
      }
    };

    loadBlockchainStatus();
  }, [filteredItems]);

  // Filter products based on search term
  const filteredProducts = filteredItems.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryChange = (category) => {
    setSearchParams({ category });
  };

  const handleSortChange = (e) => {
    dispatch(sortProducts(e.target.value));
  };

  const handleAddToCart = (product) => {
    dispatch(addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    }));
  };

  return (
    <div className="container mx-auto px-4">
      {/* Blockchain Error Message */}
      {blockchainError && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{blockchainError}</p>
            </div>
          </div>
        </div>
      )}
      {/* Search and Sort Controls */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sort by Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Category Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    currentCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="aspect-w-1 aspect-h-1">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    <div className="mb-4">
                      {nftStatus[product.id]?.verified ? (
                        <div className="bg-green-50 p-2 rounded-md mb-2">
                          <p className="text-green-700 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Blockchain Verified
                          </p>
                          <p className="text-sm text-gray-600">
                            Manufacturer: {nftStatus[product.id].manufacturer}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-2 rounded-md mb-2">
                          <p className="text-yellow-700 text-sm">
                            Blockchain verification pending
                          </p>
                        </div>
                      )}

                      {supplyChainStatus[product.id] && (
                        <div className="bg-blue-50 p-2 rounded-md mb-2">
                          <p className="text-blue-700 text-sm">
                            Status: {getStageText(supplyChainStatus[product.id].stage)}
                          </p>
                          {supplyChainStatus[product.id].location && (
                            <p className="text-sm text-gray-600">
                              Location: {supplyChainStatus[product.id].location}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold">${product.price}</span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                      {product.stock < 5 && (
                        <p className="text-red-500 text-sm mt-2">
                          Only {product.stock} left in stock!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to convert stage number to readable text
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

export default Products;