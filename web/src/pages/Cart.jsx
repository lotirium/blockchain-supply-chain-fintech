import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateQuantity, removeItem, clearCart } from '../store/slices/cartSlice';

function Cart() {
  const dispatch = useDispatch();
  const { items, total, itemCount } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.products.items);

  // Get full product details for cart items
  const cartItems = items.map(item => {
    const product = products.find(p => p.id === item.id);
    return {
      ...item,
      image: product?.image,
      stock: product?.stock
    };
  });

  const handleUpdateQuantity = (id, quantity) => {
    const product = products.find(p => p.id === id);
    if (product && quantity > 0 && quantity <= product.stock) {
      dispatch(updateQuantity({ id, quantity }));
    }
  };

  const handleRemoveItem = (id) => {
    dispatch(removeItem({ id }));
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row items-center p-6 border-b border-gray-200 last:border-b-0"
              >
                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0 mb-4 md:mb-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-grow md:ml-6">
                  <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">${item.price}</p>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-md hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-md hover:bg-gray-100"
                        disabled={item.quantity >= item.stock}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Item Total */}
                  <p className="text-right mt-4 font-semibold">
                    Subtotal: ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Items ({itemCount}):</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/products"
                className="block w-full text-center text-blue-600 hover:text-blue-800"
              >
                Continue Shopping
              </Link>

              <button
                onClick={() => dispatch(clearCart())}
                className="block w-full text-center text-red-600 hover:text-red-800"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;