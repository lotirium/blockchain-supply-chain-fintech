const { Link } = ReactRouterDOM;
const { useDispatch, useSelector } = ReactRedux;

function Products() {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = React.useState('');
  const { filteredItems, loading, categories, currentCategory, sortBy } = useSelector(
    (state) => state.products
  );

  React.useEffect(() => {
    // Fetch products when component mounts
    dispatch(window.productsActions.fetchProducts());
  }, [dispatch]);

  // Filter products based on search term
  const filteredProducts = filteredItems.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryChange = (category) => {
    dispatch(window.productsActions.setCategory(category));
  };

  const handleSortChange = (e) => {
    dispatch(window.productsActions.sortProducts(e.target.value));
  };

  const handleAddToCart = (product) => {
    dispatch(window.cartActions.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    }));
  };

  return React.createElement('div', {
    className: 'container mx-auto px-4'
  }, [
    // Search and Sort Controls
    React.createElement('div', {
      className: 'mb-8 flex flex-col md:flex-row gap-4 items-center justify-between'
    }, [
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search products...',
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        className: 'w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      }),
      React.createElement('select', {
        value: sortBy,
        onChange: handleSortChange,
        className: 'px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      }, [
        React.createElement('option', { value: 'name' }, 'Sort by Name'),
        React.createElement('option', { value: 'price-low' }, 'Price: Low to High'),
        React.createElement('option', { value: 'price-high' }, 'Price: High to Low')
      ])
    ]),

    React.createElement('div', {
      className: 'flex flex-col md:flex-row gap-8'
    }, [
      // Category Sidebar
      React.createElement('aside', {
        className: 'w-full md:w-64 flex-shrink-0'
      },
        React.createElement('div', {
          className: 'bg-white p-6 rounded-lg shadow-md'
        }, [
          React.createElement('h2', {
            className: 'text-lg font-semibold mb-4'
          }, 'Categories'),
          React.createElement('div', {
            className: 'space-y-2'
          },
            categories.map((category) =>
              React.createElement('button', {
                key: category,
                onClick: () => handleCategoryChange(category),
                className: `w-full text-left px-4 py-2 rounded-md transition-colors ${
                  currentCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`
              }, category.charAt(0).toUpperCase() + category.slice(1))
            )
          )
        ])
      ),

      // Product Grid
      React.createElement('div', {
        className: 'flex-grow'
      },
        loading
          ? React.createElement('div', {
              className: 'flex justify-center'
            },
              React.createElement('div', {
                className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'
              })
            )
          : filteredProducts.length === 0
          ? React.createElement('div', {
              className: 'text-center py-12'
            }, [
              React.createElement('h3', {
                className: 'text-xl font-semibold mb-2'
              }, 'No products found'),
              React.createElement('p', {
                className: 'text-gray-600'
              }, 'Try adjusting your search or filter criteria')
            ])
          : React.createElement('div', {
              className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            },
              filteredProducts.map((product) =>
                React.createElement('div', {
                  key: product.id,
                  className: 'bg-white rounded-lg shadow-md overflow-hidden'
                }, [
                  React.createElement('div', {
                    className: 'aspect-w-1 aspect-h-1'
                  },
                    React.createElement('img', {
                      src: product.image,
                      alt: product.name,
                      className: 'w-full h-full object-cover'
                    })
                  ),
                  React.createElement('div', {
                    className: 'p-4'
                  }, [
                    React.createElement('h3', {
                      className: 'text-lg font-semibold mb-2'
                    }, product.name),
                    React.createElement('p', {
                      className: 'text-gray-600 mb-4'
                    }, product.description),
                    React.createElement('div', {
                      className: 'flex items-center justify-between'
                    }, [
                      React.createElement('span', {
                        className: 'text-xl font-bold'
                      }, `$${product.price}`),
                      React.createElement('button', {
                        onClick: () => handleAddToCart(product),
                        className: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
                      }, 'Add to Cart')
                    ]),
                    product.stock < 5 && React.createElement('p', {
                      className: 'text-red-500 text-sm mt-2'
                    }, `Only ${product.stock} left in stock!`)
                  ])
                ])
              )
            )
      )
    ])
  ]);
}

// Make Products available globally
window.Products = Products;