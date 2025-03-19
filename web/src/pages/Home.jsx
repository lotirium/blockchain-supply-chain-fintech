import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../store/slices/productsSlice';

function Home() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Get featured products (first 6 products)
  const featuredProducts = products.slice(0, 6);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section - Modern Gradient with Overlay Image */}
      <section className="relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-primary-600"></div>
        
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-24 w-96 h-96 bg-white rounded-full"></div>
          <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-white rounded-full"></div>
          <div className="absolute top-3/4 left-1/4 w-48 h-48 bg-white rounded-full"></div>
        </div>
        
        <div className="container relative mx-auto px-4 py-28 md:py-36 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-white z-10 mb-12 md:mb-0">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Elevate Your <span className="italic">Shopping</span> Experience
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-xl">
              Discover premium products with secure blockchain verification. Quality guaranteed on every purchase.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="btn btn-primary bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Shop Now
              </Link>
              <Link
                to="/download-app"
                className="btn px-8 py-3 text-lg rounded-lg border-2 border-white text-white hover:bg-white hover:text-primary-600 transition-all duration-300"
              >
                Download App
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
              <img 
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80" 
                alt="Premium products" 
                className="rounded-lg shadow-2xl object-cover h-96 w-full"
              />
              <div className="absolute -bottom-4 -right-4 bg-white text-primary-600 font-bold px-6 py-3 rounded-lg shadow-lg">
                TRUSTED BY 10K+ CUSTOMERS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Authentic Products</h3>
                <p className="text-gray-600 text-sm">Blockchain verified</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Fast Delivery</h3>
                <p className="text-gray-600 text-sm">2-3 business days</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Secure Payment</h3>
                <p className="text-gray-600 text-sm">100% protected</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Easy Returns</h3>
                <p className="text-gray-600 text-sm">30 day returns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Blockchain Verification Explanation */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How Our Blockchain Verification Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              LogiShop uses advanced blockchain technology to ensure product authenticity and provide a transparent supply chain for all our products
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Product Registration</h3>
              <p className="text-gray-600">Each authentic product is registered on the blockchain with a unique identifier</p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Tracking</h3>
              <p className="text-gray-600">Supply chain movements are recorded as immutable transactions on the blockchain</p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">QR Code Generation</h3>
              <p className="text-gray-600">Each product receives a unique QR code linked to its blockchain record</p>
            </div>
            
            {/* Step 4 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Mobile App Verification</h3>
              <p className="text-gray-600">Customers use our mobile app to scan QR codes and verify product authenticity</p>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-md">
              <h3 className="text-xl font-bold mb-3 text-primary-700">Benefits of Blockchain Verification</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Guarantees product authenticity</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Prevents counterfeit products</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Provides transparent supply chain</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Enhances consumer trust and confidence</span>
                </li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4">Get Our Mobile App</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Download our mobile app to scan product QR codes and verify authenticity on our blockchain
              </p>
              <Link
                to="/download-app"
                className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
              >
                Download App
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - Enhanced Cards */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium products, all verified with blockchain technology
            for guaranteed authenticity and quality.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative h-64 overflow-hidden group">
                  <img
                    src={`${import.meta.env.VITE_API_URL}${product.images[0]}`}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <Link
                      to={`/products/${product.id}`}
                      className="bg-primary-600 text-white w-full py-2 rounded-lg flex items-center justify-center font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                      {product.category}
                    </span>
                    {product.inStock ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        In Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2 overflow-hidden text-ellipsis whitespace-nowrap">{product.name}</h3>
                  <p className="text-gray-600 mb-4 overflow-hidden text-ellipsis line-clamp-2 flex-1">{product.description}</p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary-700">${product.price}</span>
                      <button 
                        className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                        aria-label="Add to cart"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
          >
            View All Products
          </Link>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center p-12">
            <div className="md:w-2/3 text-white mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Summer Sale Now Live</h2>
              <p className="text-primary-100 text-lg mb-6">Get up to 40% off on selected items this week only!</p>
              <Link
                to="/products?sale=true"
                className="inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Shop the Sale
              </Link>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="relative">
                <div className="absolute -top-6 -right-6 bg-yellow-400 text-primary-800 text-xl font-bold px-4 py-2 rounded-full transform rotate-12">
                  40% OFF
                </div>
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" 
                  alt="Sale product" 
                  className="rounded-lg shadow-lg h-48 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Redesigned */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our wide range of products organized by category to find exactly what you're looking for
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link
              to="/products?category=electronics"
              className="group relative rounded-xl overflow-hidden bg-white shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="h-80">
                <img
                  src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80"
                  alt="Electronics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 to-primary-900/30 group-hover:from-primary-800/90 group-hover:to-primary-800/40 transition-all duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg transform transition-transform duration-300 group-hover:-translate-y-2">
                    <h3 className="text-primary-800 text-xl font-bold mb-2">Electronics</h3>
                    <p className="text-gray-600 mb-2">Latest gadgets and devices</p>
                    <span className="text-primary-600 font-medium flex items-center">
                      Explore Category 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:ml-2 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link
              to="/products?category=fashion"
              className="group relative rounded-xl overflow-hidden bg-white shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="h-80">
                <img
                  src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80"
                  alt="Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 to-primary-900/30 group-hover:from-primary-800/90 group-hover:to-primary-800/40 transition-all duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg transform transition-transform duration-300 group-hover:-translate-y-2">
                    <h3 className="text-primary-800 text-xl font-bold mb-2">Fashion</h3>
                    <p className="text-gray-600 mb-2">Trendy apparel and accessories</p>
                    <span className="text-primary-600 font-medium flex items-center">
                      Explore Category 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:ml-2 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link
              to="/products?category=home"
              className="group relative rounded-xl overflow-hidden bg-white shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="h-80">
                <img
                  src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80"
                  alt="Home & Living"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 to-primary-900/30 group-hover:from-primary-800/90 group-hover:to-primary-800/40 transition-all duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg transform transition-transform duration-300 group-hover:-translate-y-2">
                    <h3 className="text-primary-800 text-xl font-bold mb-2">Home & Living</h3>
                    <p className="text-gray-600 mb-2">Furniture and home décor</p>
                    <span className="text-primary-600 font-medium flex items-center">
                      Explore Category 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:ml-2 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don't take our word for it - hear from our satisfied customers about their shopping experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <div className="text-yellow-400 flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-6 italic">
              "I love the verification feature! It gives me peace of mind knowing that the products I buy are authentic and traceable."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg mr-4">
                JD
              </div>
              <div>
                <h4 className="font-bold">Jane Doe</h4>
                <p className="text-gray-500 text-sm">Loyal Customer</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <div className="text-yellow-400 flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-6 italic">
              "The quality of the products is outstanding. Fast shipping, excellent customer service, and the blockchain verification is innovative!"
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg mr-4">
                JS
              </div>
              <div>
                <h4 className="font-bold">John Smith</h4>
                <p className="text-gray-500 text-sm">Tech Enthusiast</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <div className="text-yellow-400 flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-6 italic">
              "I've been shopping here for months and have never been disappointed. The website is easy to navigate and the products are top-notch."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg mr-4">
                AL
              </div>
              <div>
                <h4 className="font-bold">Amy Lee</h4>
                <p className="text-gray-500 text-sm">Fashion Blogger</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup - Redesigned */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-600 py-16 rounded-3xl mx-4 lg:mx-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Join Our Community</h2>
            <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive deals, product updates, and blockchain insights.
              Be the first to know about our special offers!
            </p>
            <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-gray-800"
              />
              <button
                type="submit"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Subscribe
              </button>
            </form>
            <p className="text-primary-200 text-sm mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;