const { Link, useNavigate } = ReactRouterDOM;
const { useDispatch, useSelector } = ReactRedux;

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [passwordError, setPasswordError] = React.useState('');

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === 'password') {
      setPasswordError(validatePassword(value));
    }
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordError) {
      return;
    }

    if (!formData.acceptTerms) {
      return;
    }

    try {
      // Simulate registration success for now
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Registration successful! Please log in.' },
        });
      }, 1500);
    } catch (err) {
      console.error('Registration failed:', err);
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
          }, 'Create Account'),
          React.createElement('p', {
            className: 'text-gray-600 mt-2'
          }, 'Join us and start shopping today')
        ]),

        // Error Message
        error && React.createElement('div', {
          className: 'bg-red-50 text-red-600 p-4 rounded-md mb-6'
        }, error),

        // Registration Form
        React.createElement('form', {
          onSubmit: handleSubmit,
          className: 'space-y-6'
        }, [
          // Name Fields
          React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
          }, [
            // First Name
            React.createElement('div', null, [
              React.createElement('label', {
                htmlFor: 'firstName',
                className: 'block text-sm font-medium text-gray-700 mb-1'
              }, 'First Name'),
              React.createElement('input', {
                type: 'text',
                id: 'firstName',
                name: 'firstName',
                value: formData.firstName,
                onChange: handleInputChange,
                required: true,
                className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              })
            ]),
            // Last Name
            React.createElement('div', null, [
              React.createElement('label', {
                htmlFor: 'lastName',
                className: 'block text-sm font-medium text-gray-700 mb-1'
              }, 'Last Name'),
              React.createElement('input', {
                type: 'text',
                id: 'lastName',
                name: 'lastName',
                value: formData.lastName,
                onChange: handleInputChange,
                required: true,
                className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              })
            ])
          ]),

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

          // Password Fields
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
              className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            })
          ]),

          React.createElement('div', null, [
            React.createElement('label', {
              htmlFor: 'confirmPassword',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Confirm Password'),
            React.createElement('input', {
              type: 'password',
              id: 'confirmPassword',
              name: 'confirmPassword',
              value: formData.confirmPassword,
              onChange: handleInputChange,
              required: true,
              className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            }),
            passwordError && React.createElement('p', {
              className: 'mt-1 text-sm text-red-600'
            }, passwordError)
          ]),

          // Terms and Conditions
          React.createElement('div', {
            className: 'flex items-center'
          }, [
            React.createElement('input', {
              type: 'checkbox',
              id: 'acceptTerms',
              name: 'acceptTerms',
              checked: formData.acceptTerms,
              onChange: handleInputChange,
              required: true,
              className: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            }),
            React.createElement('label', {
              htmlFor: 'acceptTerms',
              className: 'ml-2 text-sm text-gray-600'
            }, [
              'I agree to the ',
              React.createElement(Link, {
                to: '/terms',
                className: 'text-blue-600 hover:text-blue-800'
              }, 'Terms and Conditions'),
              ' and ',
              React.createElement(Link, {
                to: '/privacy',
                className: 'text-blue-600 hover:text-blue-800'
              }, 'Privacy Policy')
            ])
          ]),

          // Submit Button
          React.createElement('button', {
            type: 'submit',
            disabled: loading || !!passwordError || !formData.acceptTerms,
            className: `w-full bg-blue-600 text-white px-6 py-3 rounded-md ${
              loading || !!passwordError || !formData.acceptTerms
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
              'Creating account...'
            ])
          ] : 'Create Account')
        ]),

        // Login Link
        React.createElement('div', {
          className: 'mt-6 text-center'
        },
          React.createElement('p', {
            className: 'text-sm text-gray-600'
          }, [
            'Already have an account? ',
            React.createElement(Link, {
              to: '/login',
              className: 'text-blue-600 hover:text-blue-800 font-medium'
            }, 'Sign in')
          ])
        )
      ])
    )
  );
}

// Make Register available globally
window.Register = Register;