const { Link } = ReactRouterDOM;
const { useSelector } = ReactRedux;

function Home() {
  const { items: products, loading } = useSelector((state) => state.products);
  
  // Get featured products (first 4 products)
  const featuredProducts = products.slice(0, 4);

  return React.createElement('div', {
    className: 'space-y-12'
  }, [
    // Hero Section
    React.createElement('section', {
      className: 'relative bg-blue-600 text-white py-20'
    },
      React.createElement('div', {
        className: 'container mx-auto px-4'
      },
        React.createElement('div', {
          className: 'max-w-2xl'
        }, [
          React.createElement('h1', {
            className: 'text-4xl md:text-5xl font-bold mb-4'
          }, 'Welcome to EShop'),
          React.createElement('p', {
            className: 'text-xl mb-8'
          }, 'Discover amazing products at unbeatable prices. Shop now and enjoy exclusive deals!'),
          React.createElement(Link, {
            to: '/products',
            className: 'inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors'
          }, 'Shop Now')
        ])
      )
    ),

    // Featured Products Section
    React.createElement('section', {
      className: 'container mx-auto px-4'
    }, [
      React.createElement('h2', {
        className: 'text-3xl font-bold mb-8'
      }, 'Featured Products'),
      loading
        ? React.createElement('div', {
            className: 'flex justify-center'
          },
            React.createElement('div', {
              className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'
            })
          )
        : React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
          },
            featuredProducts.map(product =>
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
                    React.createElement(Link, {
                      to: `/products/${product.id}`,
                      className: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
                    }, 'View Details')
                  ])
                ])
              ])
            )
          )
    ]),

    // Categories Section
    React.createElement('section', {
      className: 'bg-gray-100 py-12'
    },
      React.createElement('div', {
        className: 'container mx-auto px-4'
      }, [
        React.createElement('h2', {
          className: 'text-3xl font-bold mb-8'
        }, 'Shop by Category'),
        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-3 gap-6'
        }, [
          // Electronics Category
          React.createElement(Link, {
            to: '/products?category=electronics',
            className: 'group relative rounded-lg overflow-hidden bg-white shadow-md'
          }, [
            React.createElement('div', {
              className: 'aspect-w-16 aspect-h-9'
            },
              React.createElement('img', {
                src: '/images/categories/electronics.svg',
                alt: 'Electronics',
                className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              })
            ),
            React.createElement('div', {
              className: 'absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center'
            },
              React.createElement('h3', {
                className: 'text-white text-2xl font-bold'
              }, 'Electronics')
            )
          ]),

          // Fashion Category
          React.createElement(Link, {
            to: '/products?category=fashion',
            className: 'group relative rounded-lg overflow-hidden bg-white shadow-md'
          }, [
            React.createElement('div', {
              className: 'aspect-w-16 aspect-h-9'
            },
              React.createElement('img', {
                src: '/images/categories/fashion.svg',
                alt: 'Fashion',
                className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              })
            ),
            React.createElement('div', {
              className: 'absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center'
            },
              React.createElement('h3', {
                className: 'text-white text-2xl font-bold'
              }, 'Fashion')
            )
          ]),

          // Home & Living Category
          React.createElement(Link, {
            to: '/products?category=home',
            className: 'group relative rounded-lg overflow-hidden bg-white shadow-md'
          }, [
            React.createElement('div', {
              className: 'aspect-w-16 aspect-h-9'
            },
              React.createElement('img', {
                src: '/images/categories/home.svg',
                alt: 'Home & Living',
                className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              })
            ),
            React.createElement('div', {
              className: 'absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center'
            },
              React.createElement('h3', {
                className: 'text-white text-2xl font-bold'
              }, 'Home & Living')
            )
          ])
        ])
      ])
    ),

    // Newsletter Section
    React.createElement('section', {
      className: 'container mx-auto px-4 py-12'
    },
      React.createElement('div', {
        className: 'max-w-3xl mx-auto text-center'
      }, [
        React.createElement('h2', {
          className: 'text-3xl font-bold mb-4'
        }, 'Stay Updated'),
        React.createElement('p', {
          className: 'text-gray-600 mb-8'
        }, 'Subscribe to our newsletter for exclusive offers and updates'),
        React.createElement('form', {
          className: 'flex flex-col md:flex-row gap-4 justify-center',
          onSubmit: (e) => e.preventDefault()
        }, [
          React.createElement('input', {
            type: 'email',
            placeholder: 'Enter your email',
            className: 'flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          }),
          React.createElement('button', {
            type: 'submit',
            className: 'bg-blue-600 text-white px-8 py-2 rounded-md hover:bg-blue-700 transition-colors'
          }, 'Subscribe')
        ])
      ])
    )
  ]);
}

// Make Home available globally
window.Home = Home;