import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function CheckoutSuccess() {
  const location = useLocation();
  const orderDetails = location.state?.orderDetails || {
    orderId: `ORD${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    date: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. We'll email you an order confirmation with details and tracking info.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold mb-2">Order Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Order Number:</p>
                <p className="font-medium">{orderDetails.orderId}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Date:</p>
                <p className="font-medium">
                  {new Date(orderDetails.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Estimated Delivery:</p>
                <p className="font-medium">{orderDetails.estimatedDelivery}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Status:</p>
                <p className="font-medium text-green-600">Confirmed</p>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="border-b pb-4 mb-4">
            <h3 className="font-bold mb-2">Shipping Address</h3>
            <p className="text-gray-600">
              {location.state?.shippingAddress || '123 Main St, Apt 4B, New York, NY 10001'}
            </p>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="font-bold mb-2">Order Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${location.state?.subtotal || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${location.state?.total || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/products"
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            Continue Shopping
          </Link>
          <button
            onClick={handlePrint}
            className="border border-blue-600 text-blue-600 px-8 py-3 rounded-md hover:bg-blue-50 transition-colors"
          >
            Print Order
          </button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help? Contact our support team at{' '}
            <a
              href="mailto:support@eshop.com"
              className="text-blue-600 hover:text-blue-800"
            >
              support@eshop.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSuccess;