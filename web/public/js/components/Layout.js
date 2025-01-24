const { Link, Outlet, useNavigate } = ReactRouterDOM;
const { useSelector, useDispatch } = ReactRedux;

function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { itemCount } = useSelector((state) => state.cart);

  const handleLogout = async () => {
    await dispatch(window.authActions.logout());
    navigate('/');
  };

  return React.createElement('div', {
    className: 'min-h-screen flex flex-col'
  }, [
    // Header
    React.createElement('header', {
      className: 'bg-white shadow-md'
    },
      React.createElement('nav', {
        className: 'container mx-auto px-4 py-4'
      },
        React.createElement('div', {
          className: 'flex items-center justify-between'
        }, [
          // Logo
          React.createElement(Link, {
            to: '/',
            className: 'text-2xl font-bold text-blue-600'
          }, 'EShop'),

          // Main Navigation
          React.createElement('div', {
            className: 'hidden md:flex space-x-8'
          }, [
            React.createElement(Link, {
              to: '/',
              className: 'text-gray-600 hover:text-blue-600'
            }, 'Home'),
            React.createElement(Link, {
              to: '/products',
              className: 'text-gray-600 hover:text-blue-600'
            }, 'Products')
          ]),

          // Right Side Navigation
          React.createElement('div', {
            className: 'flex items-center space-x-6'
          }, [
            // Cart
            React.createElement(Link, {
              to: '/cart',
              className: 'text-gray-600 hover:text-blue-600 relative'
            }, [
              React.createElement('svg', {
                xmlns: 'http://www.w3.org/2000/svg',
                className: 'h-6 w-6',
                fill: 'none',
                viewBox: '0 0 24 24',
                stroke: 'currentColor'
              },
                React.createElement('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                })
              ),
              itemCount > 0 && React.createElement('span', {
                className: 'absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'
              }, itemCount)
            ]),

            // Auth Links
            isAuthenticated
              ? React.createElement('div', {
                  className: 'flex items-center space-x-4'
                }, [
                  React.createElement(Link, {
                    to: '/profile',
                    className: 'text-gray-600 hover:text-blue-600'
                  }, user?.name || 'Profile'),
                  React.createElement('button', {
                    onClick: handleLogout,
                    className: 'text-gray-600 hover:text-blue-600'
                  }, 'Logout')
                ])
              : React.createElement('div', {
                  className: 'flex items-center space-x-4'
                }, [
                  React.createElement(Link, {
                    to: '/login',
                    className: 'text-gray-600 hover:text-blue-600'
                  }, 'Login'),
                  React.createElement(Link, {
                    to: '/register',
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'
                  }, 'Register')
                ])
          ])
        ])
      )
    ),

    // Main Content
    React.createElement('main', {
      className: 'flex-grow container mx-auto px-4 py-8'
    },
      React.createElement(Outlet)
    ),

    // Footer
    React.createElement('footer', {
      className: 'bg-gray-800 text-white'
    },
      React.createElement('div', {
        className: 'container mx-auto px-4 py-8'
      }, [
        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-3 gap-8'
        }, [
          // Company Info
          React.createElement('div', null, [
            React.createElement('h3', {
              className: 'text-xl font-bold mb-4'
            }, 'EShop'),
            React.createElement('p', {
              className: 'text-gray-300'
            }, 'Your one-stop shop for all your needs. Quality products at competitive prices.')
          ]),

          // Quick Links
          React.createElement('div', null, [
            React.createElement('h3', {
              className: 'text-xl font-bold mb-4'
            }, 'Quick Links'),
            React.createElement('ul', {
              className: 'space-y-2'
            }, [
              React.createElement('li', null,
                React.createElement(Link, {
                  to: '/products',
                  className: 'text-gray-300 hover:text-white'
                }, 'Products')
              ),
              React.createElement('li', null,
                React.createElement(Link, {
                  to: '/cart',
                  className: 'text-gray-300 hover:text-white'
                }, 'Cart')
              ),
              React.createElement('li', null,
                React.createElement(Link, {
                  to: '/profile',
                  className: 'text-gray-300 hover:text-white'
                }, 'My Account')
              )
            ])
          ]),

          // Contact/Social
          React.createElement('div', null, [
            React.createElement('h3', {
              className: 'text-xl font-bold mb-4'
            }, 'Connect With Us'),
            React.createElement('div', {
              className: 'flex space-x-4'
            }, [
              React.createElement('a', {
                href: '#',
                className: 'text-gray-300 hover:text-white'
              }, 'Facebook'),
              React.createElement('a', {
                href: '#',
                className: 'text-gray-300 hover:text-white'
              }, 'Twitter'),
              React.createElement('a', {
                href: '#',
                className: 'text-gray-300 hover:text-white'
              }, 'Instagram')
            ])
          ])
        ]),

        // Copyright
        React.createElement('div', {
          className: 'mt-8 pt-8 border-t border-gray-700 text-center text-gray-300'
        },
          React.createElement('p', null,
            `© ${new Date().getFullYear()} EShop. All rights reserved.`
          )
        )
      ])
    )
  ]);
}

// Make Layout available globally
window.Layout = Layout;