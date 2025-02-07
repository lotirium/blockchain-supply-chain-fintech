import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, setCategory, sortProducts } from '../store/slices/productsSlice';
import { addItem } from '../store/slices/cartSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
function Products() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const { filteredItems, loading, categories, currentCategory, sortBy } = useSelector(
    (state) => state.products
  );

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

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
    // Validate store information exists
    if (!product.store_id || !product.store) {
      console.error('Product missing store information:', product);
      alert('Unable to add item to cart: Missing store information');
      return;
    }

    dispatch(addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      store_id: product.store_id,
      store: product.store
    }));

    // Log successful cart addition
    console.log('Added item to cart with store info:', {
      productId: product.id,
      productName: product.name,
      storeId: product.store_id,
      storeName: product.store.name
    });
  };

  return (
    <div className="container mx-auto px-4">

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
                      src={product.images?.[0] ? `${API_URL}${product.images[0]}` : product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    {/* Display store information */}
                    {product.store && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          Sold by: {product.store.name}
                          {product.store.is_verified && (
                            <span className="ml-1 text-blue-500">✓</span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-bold">${product.price}</span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        disabled={!product.store_id || !product.store}
                        title={!product.store_id ? "Store information unavailable" : ""}
                      >
                        Add to Cart
                      </button>
                    </div>
                    
                    {product.stock < 5 && (
                      <p className="text-red-500 text-sm mt-2">
                        Only {product.stock} left in stock!
                      </p>
                    )}
                    
                    {(!product.store_id || !product.store) && (
                      <p className="text-red-500 text-sm mt-2">
                        Store information unavailable
                      </p>
                    )}
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



export default Products;