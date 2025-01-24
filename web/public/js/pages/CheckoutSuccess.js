const { Link, useLocation } = ReactRouterDOM;

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

  return React.createElement('div', {
    className: 'container mx-auto px-4 py-8'
  },
    React.createElement('div', {
      className: 'max-w-3xl mx-auto'
    }, [
      // Success Message
      React.createElement('div', {
        className: 'text-center mb-8'
      }, [
        React.createElement('div', {
          className: 'inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4'
        },
          React.createElement('svg', {
            className: 'w-8 h-8 text-green-600',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M5 13l4 4L19 7'
            })
          )
        ),
        React.createElement('h1', {
          className: 'text-3xl font-bold mb-2'
        }, 'Order Confirmed!'),
        React.createElement('p', {
          className: 'text-gray-600'
        }, 'Thank you for your purchase. We\'ll email you an order confirmation with details and tracking info.')
      ]),

      // Order Details
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 mb-8'
      }, [
        React.createElement('div', {
          className: 'border-b pb-4 mb-4'
        }, [
          React.createElement('h2', {
            className: 'text-xl font-bold mb-2'
          }, 'Order Details'),
          React.createElement('div', {
            className: 'grid grid-cols-2 gap-4 text-sm'
          }, [
            React.createElement('div', null, [
              React.createElement('p', {
                className: 'text-gray-600'
              }, 'Order Number:'),
              React.createElement('p', {
                className: 'font-medium'
              }, orderDetails.orderId)
            ]),
            React.createElement('div', null, [
              React.createElement('p', {
                className: 'text-gray-600'
              }, 'Order Date:'),
              React.createElement('p', {
                className: 'font-medium'
              }, new Date(orderDetails.date).toLocaleDateString())
            ]),
            React.createElement('div', null, [
              React.createElement('p', {
                className: 'text-gray-600'
              }, 'Estimated Delivery:'),
              React.createElement('p', {
                className: 'font-medium'
              }, orderDetails.estimatedDelivery)
            ]),
            React.createElement('div', null, [
              React.createElement('p', {
                className: 'text-gray-600'
              }, 'Order Status:'),
              React.createElement('p', {
                className: 'font-medium text-green-600'
              }, 'Confirmed')
            ])
          ])
        ]),

        // Shipping Information
        React.createElement('div', {
          className: 'border-b pb-4 mb-4'
        }, [
          React.createElement('h3', {
            className: 'font-bold mb-2'
          }, 'Shipping Address'),
          React.createElement('p', {
            className: 'text-gray-600'
          }, orderDetails.shippingAddress || '123 Main St, Apt 4B, New York, NY 10001')
        ]),

        // Order Summary
        React.createElement('div', null, [
          React.createElement('h3', {
            className: 'font-bold mb-2'
          }, 'Order Summary'),
          React.createElement('div', {
            className: 'space-y-2 mb-4'
          }, [
            React.createElement('div', {
              className: 'flex justify-between'
            }, [
              React.createElement('span', {
                className: 'text-gray-600'
              }, 'Subtotal'),
              React.createElement('span', null,
                `$${orderDetails.total?.toFixed(2) || '0.00'}`
              )
            ]),
            React.createElement('div', {
              className: 'flex justify-between'
            }, [
              React.createElement('span', {
                className: 'text-gray-600'
              }, 'Shipping'),
              React.createElement('span', null, 'Free')
            ]),
            React.createElement('div', {
              className: 'flex justify-between font-bold'
            }, [
              React.createElement('span', null, 'Total'),
              React.createElement('span', null,
                `$${orderDetails.total?.toFixed(2) || '0.00'}`
              )
            ])
          ])
        ])
      ]),

      // Action Buttons
      React.createElement('div', {
        className: 'flex flex-col sm:flex-row gap-4 justify-center'
      }, [
        React.createElement(Link, {
          to: '/products',
          className: 'bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors text-center'
        }, 'Continue Shopping'),
        React.createElement('button', {
          onClick: handlePrint,
          className: 'border border-blue-600 text-blue-600 px-8 py-3 rounded-md hover:bg-blue-50 transition-colors'
        }, 'Print Order')
      ]),

      // Additional Information
      React.createElement('div', {
        className: 'mt-8 text-center text-sm text-gray-600'
      },
        React.createElement('p', null, [
          'Need help? Contact our support team at ',
          React.createElement('a', {
            href: 'mailto:support@eshop.com',
            className: 'text-blue-600 hover:text-blue-800'
          }, 'support@eshop.com')
        ])
      )
    ])
  );
}

// Make CheckoutSuccess available globally
window.CheckoutSuccess = CheckoutSuccess;