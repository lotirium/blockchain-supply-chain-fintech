const { Link, useNavigate, useLocation } = ReactRouterDOM;
const { useDispatch, useSelector } = ReactRedux;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(window.authActions.login(formData)).unwrap();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return React.createElement('div', {
    className: 'min-h-[80vh] flex items-center justify-center'
  },
    React.createElement('div', {
      className: 'max-w-md w-full mx-4'
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-8'
      }, [
        // Header
        React.createElement('div', {
          className: 'text-center mb-8'
        }, [
          React.createElement('h1', {
            className: 'text-3xl font-bold'
          }, 'Welcome Back'),
          React.createElement('p', {
            className: 'text-gray-600 mt-2'
          }, 'Sign in to your account to continue')
        ]),

        // Error Message
        error && React.createElement('div', {
          className: 'bg-red-50 text-red-600 p-4 rounded-md mb-6'
        }, error),

        // Login Form
        React.createElement('form', {
          onSubmit: handleSubmit,
          className: 'space-y-6'
        }, [
          // Email Field
          React.createElement('div', null, [
            React.createElement('label', {
              htmlFor: 'email',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Email Address'),
            React.createElement('input', {
              type: 'email',
              id: 'email',
              name: 'email',
              value: formData.email,
              onChange: handleInputChange,
              required: true,
              className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              placeholder: 'you@example.com'
            })
          ]),

          // Password Field
          React.createElement('div', null, [
            React.createElement('label', {
              htmlFor: 'password',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Password'),
            React.createElement('input', {
              type: 'password',
              id: 'password',
              name: 'password',
              value: formData.password,
              onChange: handleInputChange,
              required: true,
              className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              placeholder: '••••••••'
            })
          ]),

          // Remember Me & Forgot Password
          React.createElement('div', {
            className: 'flex items-center justify-between'
          }, [
            React.createElement('label', {
              className: 'flex items-center'
            }, [
              React.createElement('input', {
                type: 'checkbox',
                name: 'rememberMe',
                checked: formData.rememberMe,
                onChange: handleInputChange,
                className: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              }),
              React.createElement('span', {
                className: 'ml-2 text-sm text-gray-600'
              }, 'Remember me')
            ]),
            React.createElement(Link, {
              to: '/forgot-password',
              className: 'text-sm text-blue-600 hover:text-blue-800'
            }, 'Forgot password?')
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
              'Signing in...'
            ])
          ] : 'Sign In')
        ]),

        // Register Link
        React.createElement('div', {
          className: 'mt-6 text-center'
        },
          React.createElement('p', {
            className: 'text-sm text-gray-600'
          }, [
            'Don\'t have an account? ',
            React.createElement(Link, {
              to: '/register',
              className: 'text-blue-600 hover:text-blue-800 font-medium'
            }, 'Sign up')
          ])
        )
      ])
    )
  );
}

// Make Login available globally
window.Login = Login;