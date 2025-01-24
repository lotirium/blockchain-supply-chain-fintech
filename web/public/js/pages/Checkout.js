const { useNavigate } = ReactRouterDOM;
const { useDispatch, useSelector } = ReactRedux;

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);
  const [loading, setLoading] = React.useState(false);
  const [sameAsShipping, setSameAsShipping] = React.useState(true);
  const [formData, setFormData] = React.useState({
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

  // Redirect to cart if no items
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear cart and redirect to success page
      dispatch(window.cartActions.clearCart());
      navigate('/checkout/success', {
        state: {
          orderDetails: {
            orderId: `ORD${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            date: new Date().toISOString(),
            total,
            shippingAddress: `${formData.shippingAddress}, ${formData.shippingCity}, ${formData.shippingState} ${formData.shippingZip}`
          }
        }
      });
    } catch (error) {
      console.error('Checkout failed:', error);
      setLoading(false);
    }
  };

  return React.createElement('div', {
    className: 'container mx-auto px-4 py-8'
  }, [
    React.createElement('h1', {
      className: 'text-3xl font-bold mb-8'
    }, 'Checkout'),

    React.createElement('div', {
      className: 'grid grid-cols-1 lg:grid-cols-2 gap-8'
    }, [
      // Checkout Form
      React.createElement('div', null,
        React.createElement('form', {
          onSubmit: handleSubmit,
          className: 'space-y-8'
        }, [
          // Shipping Information
          React.createElement('div', {
            className: 'bg-white rounded-lg shadow-md p-6'
          }, [
            React.createElement('h2', {
              className: 'text-xl font-bold mb-4'
            }, 'Shipping Information'),
            React.createElement('div', {
              className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
            }, [
              // First Name
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'First Name'),
                React.createElement('input', {
                  type: 'text',
                  name: 'shippingFirstName',
                  value: formData.shippingFirstName,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // Last Name
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Last Name'),
                React.createElement('input', {
                  type: 'text',
                  name: 'shippingLastName',
                  value: formData.shippingLastName,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // Email
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Email'),
                React.createElement('input', {
                  type: 'email',
                  name: 'shippingEmail',
                  value: formData.shippingEmail,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // Phone
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Phone'),
                React.createElement('input', {
                  type: 'tel',
                  name: 'shippingPhone',
                  value: formData.shippingPhone,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // Address
              React.createElement('div', {
                className: 'md:col-span-2'
              }, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Address'),
                React.createElement('input', {
                  type: 'text',
                  name: 'shippingAddress',
                  value: formData.shippingAddress,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // City
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'City'),
                React.createElement('input', {
                  type: 'text',
                  name: 'shippingCity',
                  value: formData.shippingCity,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // State
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'State'),
                React.createElement('input', {
                  type: 'text',
                  name: 'shippingState',
                  value: formData.shippingState,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // ZIP Code
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'ZIP Code'),
                React.createElement('input', {
                  type: 'text',
                  name: 'shippingZip',
                  value: formData.shippingZip,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ])
            ])
          ]),

          // Billing Information
          React.createElement('div', {
            className: 'bg-white rounded-lg shadow-md p-6'
          }, [
            React.createElement('div', {
              className: 'flex items-center justify-between mb-4'
            }, [
              React.createElement('h2', {
                className: 'text-xl font-bold'
              }, 'Billing Information'),
              React.createElement('label', {
                className: 'flex items-center'
              }, [
                React.createElement('input', {
                  type: 'checkbox',
                  checked: sameAsShipping,
                  onChange: (e) => setSameAsShipping(e.target.checked),
                  className: 'mr-2'
                }),
                React.createElement('span', {
                  className: 'text-sm text-gray-600'
                }, 'Same as shipping')
              ])
            ]),

            !sameAsShipping && React.createElement('div', {
              className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
            }, [
              // Billing form fields - similar to shipping fields
              // Add billing form fields here if needed
            ])
          ]),

          // Payment Information
          React.createElement('div', {
            className: 'bg-white rounded-lg shadow-md p-6'
          }, [
            React.createElement('h2', {
              className: 'text-xl font-bold mb-4'
            }, 'Payment Information'),
            React.createElement('div', {
              className: 'space-y-4'
            }, [
              // Card Number
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Card Number'),
                React.createElement('input', {
                  type: 'text',
                  name: 'cardNumber',
                  value: formData.cardNumber,
                  onChange: handleInputChange,
                  required: true,
                  placeholder: '1234 5678 9012 3456',
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              React.createElement('div', {
                className: 'grid grid-cols-2 gap-4'
              }, [
                // Expiry Date
                React.createElement('div', null, [
                  React.createElement('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1'
                  }, 'Expiry Date'),
                  React.createElement('input', {
                    type: 'text',
                    name: 'cardExpiry',
                    value: formData.cardExpiry,
                    onChange: handleInputChange,
                    required: true,
                    placeholder: 'MM/YY',
                    className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  })
                ]),
                // CVC
                React.createElement('div', null, [
                  React.createElement('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1'
                  }, 'CVC'),
                  React.createElement('input', {
                    type: 'text',
                    name: 'cardCvc',
                    value: formData.cardCvc,
                    onChange: handleInputChange,
                    required: true,
                    placeholder: '123',
                    className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  })
                ])
              ])
            ])
          ]),

          // Submit Button
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: `w-full bg-blue-600 text-white px-6 py-3 rounded-md ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700 transition-colors'
            }`
          }, loading ? [
            React.createElement('span', {
              className: 'flex items-center justify-center'
            }, [
              React.createElement('svg', {
                className: 'animate-spin -ml-1 mr-3 h-5 w-5 text-white',
                xmlns: 'http://www.w3.org/2000/svg',
                fill: 'none',
                viewBox: '0 0 24 24'
              }, [
                React.createElement('circle', {
                  className: 'opacity-25',
                  cx: '12',
                  cy: '12',
                  r: '10',
                  stroke: 'currentColor',
                  strokeWidth: '4'
                }),
                React.createElement('path', {
                  className: 'opacity-75',
                  fill: 'currentColor',
                  d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                })
              ]),
              'Processing...'
            ])
          ] : `Place Order - $${total.toFixed(2)}`)
        ])
      ),

      // Order Summary
      React.createElement('div', {
        className: 'lg:pl-8'
      },
        React.createElement('div', {
          className: 'bg-white rounded-lg shadow-md p-6 sticky top-8'
        }, [
          React.createElement('h2', {
            className: 'text-xl font-bold mb-4'
          }, 'Order Summary'),
          React.createElement('div', {
            className: 'space-y-4'
          }, [
            // Cart Items
            ...items.map((item) =>
              React.createElement('div', {
                key: item.id,
                className: 'flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0'
              }, [
                React.createElement('div', {
                  className: 'flex items-center'
                }, [
                  React.createElement('span', {
                    className: 'font-medium'
                  }, item.name),
                  React.createElement('span', {
                    className: 'text-gray-600 ml-2'
                  }, `x${item.quantity}`)
                ]),
                React.createElement('span', null,
                  `$${(item.price * item.quantity).toFixed(2)}`
                )
              ])
            ),
            // Order Totals
            React.createElement('div', {
              className: 'border-t pt-4'
            }, [
              React.createElement('div', {
                className: 'flex justify-between'
              }, [
                React.createElement('span', null, 'Subtotal:'),
                React.createElement('span', null, `$${total.toFixed(2)}`)
              ]),
              React.createElement('div', {
                className: 'flex justify-between mt-2'
              }, [
                React.createElement('span', null, 'Shipping:'),
                React.createElement('span', null, 'Free')
              ]),
              React.createElement('div', {
                className: 'flex justify-between mt-2 font-bold'
              }, [
                React.createElement('span', null, 'Total:'),
                React.createElement('span', null, `$${total.toFixed(2)}`)
              ])
            ])
          ])
        ])
      )
    ])
  ]);
}

// Make Checkout available globally
window.Checkout = Checkout;