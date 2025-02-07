import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { getProfile } from '../store/slices/authSlice';
import websocketService from '../services/websocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [formData, setFormData] = useState({
    // Shipping Info
    shippingFirstName: '',
    shippingLastName: '',
    shippingEmail: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    // Billing Info
    billingFirstName: '',
    billingLastName: '',
    billingEmail: '',
    billingPhone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    // Payment Info
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  useEffect(() => {
    // Check authentication and cart
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (items.length === 0) {
      console.log('❌ Cart is empty, redirecting to cart');
      navigate('/cart');
      return;
    }

    // Verify user profile is loaded
    if (!user) {
      console.log('🔄 Fetching user profile...');
      dispatch(getProfile());
    }
  }, [isAuthenticated, items.length, user, navigate, dispatch]);

  // Early return if not authenticated or cart is empty
  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  // Early return if user profile is not loaded
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Implement request with retry logic and exponential backoff
  const makeRequest = async (orderData, token, retryCount = 0) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`⚠️ Request timeout triggered (attempt ${retryCount + 1} of 3)`);
      controller.abort();
    }, 65000); // 65 second timeout (slightly longer than server's 60s)

    const startTime = Date.now();
    console.log(`📤 Sending request (attempt ${retryCount + 1} of 3)...`);

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow'
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ Request completed in ${duration}ms`);
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        
        let errorMessage = 'Failed to process order.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      console.log(`⏱️ Request duration before error: ${duration}ms`);
      
      if (error.name === 'AbortError' && retryCount < 2) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`🔄 Retrying request in ${backoffDelay}ms (attempt ${retryCount + 2} of 3)...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return makeRequest(orderData, token, retryCount + 1);
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) {
      console.log('🛑 Preventing multiple submissions - form is already processing');
      return;
    }
    
    console.log('🚀 Starting checkout process...');
    console.log('📦 Cart items:', items);
    console.log('💰 Total amount:', total);
    
    setLoading(true);

    try {
      // Check authentication first
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        throw new Error('Please login to continue with checkout');
      }

      // Establish WebSocket connection
      console.log('🔌 Establishing WebSocket connection...');
      websocketService.connect();
      
      // Subscribe to order notifications (cleanup will happen automatically)
      websocketService.subscribe('new_order', (payload) => {
        console.log('📦 Received order notification:', payload);
      });
      
      // Enhanced store validation with better error messages
      if (items.length === 0) {
        throw new Error('Your cart is empty');
      }

      const firstItem = items[0];
      if (!firstItem.store_id || !firstItem.store) {
        console.error('Cart item missing store information:', firstItem);
        throw new Error('Store information is missing from cart items. Please try adding the items to your cart again.');
      }

      const storeId = firstItem.store_id;
      const storeName = firstItem.store.name;
      
      // Validate all items are from the same store with detailed error
      const invalidItems = items.filter(item => item.store_id !== storeId);
      if (invalidItems.length > 0) {
        console.error('Items from different stores found:', invalidItems);
        throw new Error(`All items must be from the same store. Please create separate orders for items from different stores.`);
      }

      console.log(`✅ All items verified from store: ${storeName} (${storeId})`);

      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        storeId,
        shippingAddress: {
          firstName: formData.shippingFirstName,
          lastName: formData.shippingLastName,
          email: formData.shippingEmail,
          phone: formData.shippingPhone,
          address: formData.shippingAddress,
          city: formData.shippingCity,
          state: formData.shippingState,
          zip: formData.shippingZip
        },
        paymentMethod: 'fiat',
        shippingMethod: 'standard'
      };

      console.log('🌐 Making API request to create order...');
      console.log('🔑 Auth token:', token.substring(0, 10) + '...');
      console.log('📦 Request payload:', orderData);

      // Make the request with retry logic
      const response = await makeRequest(orderData, token);
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Parsed response data:', data);
      } catch (error) {
        console.error('❌ Failed to parse response as JSON:', error);
        throw new Error('Invalid JSON response from server');
      }

      if (!data.success) {
        console.error('❌ Order creation unsuccessful:', data);
        throw new Error('Order creation was not successful');
      }

      console.log('✅ Order created successfully:', data);

      // Clear cart and redirect
      console.log('🗑️ Clearing cart...');
      dispatch(clearCart());

      console.log('🎯 Redirecting to success page...');
      navigate('/checkout/success', {
        state: {
          orderDetails: {
            orderId: data.data.orderId,
            status: data.data.status,
            date: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            subtotal: total,
            total: data.data.total || total,
            shippingAddress: `${formData.shippingAddress}, ${formData.shippingCity}, ${formData.shippingState} ${formData.shippingZip}`
          }
        },
        replace: true
      });
    } catch (error) {
      console.error('❌ Checkout process failed:', error);
      
      let errorMessage = 'Failed to process order. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'The order is taking longer than expected. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      console.log('🏁 Checkout process completed');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="shippingFirstName"
                    value={formData.shippingFirstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="shippingLastName"
                    value={formData.shippingLastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="shippingEmail"
                    value={formData.shippingEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="shippingState"
                    value={formData.shippingState}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="shippingZip"
                    value={formData.shippingZip}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Billing Information</h2>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    Same as shipping
                  </span>
                </label>
              </div>

              {!sameAsShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Billing form fields - similar to shipping fields */}
                  {/* Add billing form fields here */}
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Payment Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      required
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      name="cardCvc"
                      value={formData.cardCvc}
                      onChange={handleInputChange}
                      required
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white px-6 py-3 rounded-md ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700 transition-colors'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Place Order - $${total.toFixed(2)}`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:pl-8">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600 ml-2">x{item.quantity}</span>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between mt-2 font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;