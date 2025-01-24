import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../store/slices/cartSlice';
import { selectProductById, selectProducts } from '../store/slices/productsSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);
  
  // Get product from store using memoized selector
  const storeProduct = useSelector(state => selectProductById(state, id));
  const allProducts = useSelector(selectProducts);
  
  // Fetch product from API if not in store
  useEffect(() => {
    const fetchProduct = async () => {
      if (storeProduct) {
        setProductData(storeProduct);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/products/detail/${id}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        setProductData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, storeProduct]);

  // Get related products (same category, excluding current product)
  const relatedProducts = allProducts
    .filter(p => p.category === productData?.category && p.id !== id)
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Link
            to="/products"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= productData.stock) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    dispatch(addItem({
      id: productData.id,
      name: productData.name,
      price: productData.price,
      quantity
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Products */}
      <Link
        to="/products"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Products
      </Link>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img
            src={productData.images?.[0] ? `${API_URL}${productData.images[0]}` : productData.image}
            alt={productData.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{productData.name}</h1>
          <p className="text-gray-600">{productData.description}</p>
          
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold">${productData.price}</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              productData.stock > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {productData.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {productData.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label htmlFor="quantity" className="text-gray-700">
                  Quantity:
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={productData.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={handleAddToCart}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add to Cart
              </button>
              
              {productData.stock < 5 && (
                <p className="text-red-500 text-sm">
                  Only {productData.stock} left in stock - order soon!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                to={`/products/${relatedProduct.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={relatedProduct.images?.[0] ? `${API_URL}${relatedProduct.images[0]}` : relatedProduct.image}
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-xl font-bold">${relatedProduct.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* This would typically be populated with real reviews from an API */}
          <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;