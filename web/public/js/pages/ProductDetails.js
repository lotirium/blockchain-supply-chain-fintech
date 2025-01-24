const { useParams, Link } = ReactRouterDOM;
const { useDispatch, useSelector } = ReactRedux;

function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [quantity, setQuantity] = React.useState(1);
  
  // Get product from store
  const product = useSelector((state) =>
    state.products.items.find((p) => p.id === parseInt(id))
  );
  
  // Get related products (same category, excluding current product)
  const relatedProducts = useSelector((state) =>
    state.products.items
      .filter((p) => p.category === product?.category && p.id !== product?.id)
      .slice(0, 4)
  );

  if (!product) {
    return React.createElement('div', {
      className: 'container mx-auto px-4 py-8'
    },
      React.createElement('div', {
        className: 'text-center'
      }, [
        React.createElement('h2', {
          className: 'text-2xl font-bold mb-4'
        }, 'Product Not Found'),
        React.createElement(Link, {
          to: '/products',
          className: 'text-blue-600 hover:text-blue-800'
        }, 'Back to Products')
      ])
    );
  }

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    dispatch(window.cartActions.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity
    }));
  };

  return React.createElement('div', {
    className: 'container mx-auto px-4 py-8'
  }, [
    // Back to Products Link
    React.createElement(Link, {
      to: '/products',
      className: 'inline-flex items-center text-blue-600 hover:text-blue-800 mb-8'
    }, [
      React.createElement('svg', {
        className: 'w-5 h-5 mr-2',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M15 19l-7-7 7-7'
        })
      ),
      'Back to Products'
    ]),

    // Product Details Grid
    React.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 gap-8 mb-12'
    }, [
      // Product Image
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md overflow-hidden'
      },
        React.createElement('img', {
          src: product.image,
          alt: product.name,
          className: 'w-full h-full object-cover'
        })
      ),

      // Product Info
      React.createElement('div', {
        className: 'space-y-6'
      }, [
        React.createElement('h1', {
          className: 'text-3xl font-bold'
        }, product.name),
        React.createElement('p', {
          className: 'text-gray-600'
        }, product.description),
        
        React.createElement('div', {
          className: 'flex items-center space-x-4'
        }, [
          React.createElement('span', {
            className: 'text-3xl font-bold'
          }, `$${product.price}`),
          React.createElement('span', {
            className: `px-3 py-1 rounded-full text-sm ${
              product.stock > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`
          }, product.stock > 0 ? 'In Stock' : 'Out of Stock')
        ]),

        product.stock > 0 && React.createElement('div', {
          className: 'space-y-4'
        }, [
          React.createElement('div', {
            className: 'flex items-center space-x-4'
          }, [
            React.createElement('label', {
              htmlFor: 'quantity',
              className: 'text-gray-700'
            }, 'Quantity:'),
            React.createElement('input', {
              type: 'number',
              id: 'quantity',
              min: '1',
              max: product.stock,
              value: quantity,
              onChange: handleQuantityChange,
              className: 'w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            })
          ]),
          
          React.createElement('button', {
            onClick: handleAddToCart,
            className: 'w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors'
          }, 'Add to Cart'),
          
          product.stock < 5 && React.createElement('p', {
            className: 'text-red-500 text-sm'
          }, `Only ${product.stock} left in stock - order soon!`)
        ])
      ])
    ]),

    // Related Products
    relatedProducts.length > 0 && React.createElement('div', {
      className: 'mt-12'
    }, [
      React.createElement('h2', {
        className: 'text-2xl font-bold mb-6'
      }, 'Related Products'),
      React.createElement('div', {
        className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
      },
        relatedProducts.map((relatedProduct) =>
          React.createElement(Link, {
            key: relatedProduct.id,
            to: `/products/${relatedProduct.id}`,
            className: 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
          }, [
            React.createElement('div', {
              className: 'aspect-w-1 aspect-h-1'
            },
              React.createElement('img', {
                src: relatedProduct.image,
                alt: relatedProduct.name,
                className: 'w-full h-full object-cover'
              })
            ),
            React.createElement('div', {
              className: 'p-4'
            }, [
              React.createElement('h3', {
                className: 'text-lg font-semibold mb-2'
              }, relatedProduct.name),
              React.createElement('p', {
                className: 'text-xl font-bold'
              }, `$${relatedProduct.price}`)
            ])
          ])
        )
      )
    ])
  ]);
}

// Make ProductDetails available globally
window.ProductDetails = ProductDetails;