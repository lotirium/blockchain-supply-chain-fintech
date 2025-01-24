const { useDispatch, useSelector } = ReactRedux;

function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = React.useState(false);
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(window.authActions.updateProfile(formData)).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    // Handle password update logic here
    setShowPasswordForm(false);
  };

  // Mock order history data
  const orders = [
    {
      id: '1',
      date: '2024-01-15',
      total: 199.99,
      status: 'Delivered',
      items: 3,
    },
    {
      id: '2',
      date: '2024-01-10',
      total: 149.99,
      status: 'Processing',
      items: 2,
    },
  ];

  return React.createElement('div', {
    className: 'container mx-auto px-4 py-8'
  }, [
    React.createElement('h1', {
      className: 'text-3xl font-bold mb-8'
    }, 'My Account'),

    React.createElement('div', {
      className: 'grid grid-cols-1 lg:grid-cols-3 gap-8'
    }, [
      // Profile Information
      React.createElement('div', {
        className: 'lg:col-span-2'
      },
        React.createElement('div', {
          className: 'bg-white rounded-lg shadow-md p-6'
        }, [
          // Profile Header
          React.createElement('div', {
            className: 'flex justify-between items-center mb-6'
          }, [
            React.createElement('h2', {
              className: 'text-xl font-bold'
            }, 'Profile Information'),
            React.createElement('button', {
              onClick: () => setIsEditing(!isEditing),
              className: 'text-blue-600 hover:text-blue-800'
            }, isEditing ? 'Cancel' : 'Edit')
          ]),

          // Error Message
          error && React.createElement('div', {
            className: 'bg-red-50 text-red-600 p-4 rounded-md mb-6'
          }, error),

          // Profile Form
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
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'First Name'),
                React.createElement('input', {
                  type: 'text',
                  name: 'firstName',
                  value: formData.firstName,
                  onChange: handleInputChange,
                  disabled: !isEditing,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                })
              ]),
              // Last Name
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Last Name'),
                React.createElement('input', {
                  type: 'text',
                  name: 'lastName',
                  value: formData.lastName,
                  onChange: handleInputChange,
                  disabled: !isEditing,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                })
              ])
            ]),

            // Email Field
            React.createElement('div', null, [
              React.createElement('label', {
                className: 'block text-sm font-medium text-gray-700 mb-1'
              }, 'Email Address'),
              React.createElement('input', {
                type: 'email',
                name: 'email',
                value: formData.email,
                onChange: handleInputChange,
                disabled: !isEditing,
                className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
              })
            ]),

            // Phone Field
            React.createElement('div', null, [
              React.createElement('label', {
                className: 'block text-sm font-medium text-gray-700 mb-1'
              }, 'Phone Number'),
              React.createElement('input', {
                type: 'tel',
                name: 'phone',
                value: formData.phone,
                onChange: handleInputChange,
                disabled: !isEditing,
                className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
              })
            ]),

            // Save Button
            isEditing && React.createElement('div', {
              className: 'flex justify-end'
            },
              React.createElement('button', {
                type: 'submit',
                disabled: loading,
                className: 'bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
              }, loading ? 'Saving...' : 'Save Changes')
            )
          ]),

          // Password Change Section
          React.createElement('div', {
            className: 'mt-8 pt-8 border-t border-gray-200'
          }, [
            React.createElement('div', {
              className: 'flex justify-between items-center mb-6'
            }, [
              React.createElement('h2', {
                className: 'text-xl font-bold'
              }, 'Password'),
              React.createElement('button', {
                onClick: () => setShowPasswordForm(!showPasswordForm),
                className: 'text-blue-600 hover:text-blue-800'
              }, showPasswordForm ? 'Cancel' : 'Change Password')
            ]),

            showPasswordForm && React.createElement('form', {
              onSubmit: handlePasswordSubmit,
              className: 'space-y-4'
            }, [
              // Current Password
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Current Password'),
                React.createElement('input', {
                  type: 'password',
                  name: 'currentPassword',
                  value: passwordData.currentPassword,
                  onChange: handlePasswordChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // New Password
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'New Password'),
                React.createElement('input', {
                  type: 'password',
                  name: 'newPassword',
                  value: passwordData.newPassword,
                  onChange: handlePasswordChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // Confirm New Password
              React.createElement('div', null, [
                React.createElement('label', {
                  className: 'block text-sm font-medium text-gray-700 mb-1'
                }, 'Confirm New Password'),
                React.createElement('input', {
                  type: 'password',
                  name: 'confirmPassword',
                  value: passwordData.confirmPassword,
                  onChange: handlePasswordChange,
                  required: true,
                  className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ]),
              // Update Password Button
              React.createElement('div', {
                className: 'flex justify-end'
              },
                React.createElement('button', {
                  type: 'submit',
                  className: 'bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors'
                }, 'Update Password')
              )
            ])
          ]),

          // Account Deletion
          React.createElement('div', {
            className: 'mt-8 pt-8 border-t border-gray-200'
          }, [
            React.createElement('h2', {
              className: 'text-xl font-bold text-red-600 mb-4'
            }, 'Delete Account'),
            React.createElement('p', {
              className: 'text-gray-600 mb-4'
            }, 'Once you delete your account, there is no going back. Please be certain.'),
            React.createElement('button', {
              onClick: () => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // Dispatch delete account action
                }
              },
              className: 'text-red-600 hover:text-red-800 font-medium'
            }, 'Delete Account')
          ])
        ])
      ),

      // Order History
      React.createElement('div', {
        className: 'lg:col-span-1'
      },
        React.createElement('div', {
          className: 'bg-white rounded-lg shadow-md p-6'
        }, [
          React.createElement('h2', {
            className: 'text-xl font-bold mb-6'
          }, 'Order History'),
          React.createElement('div', {
            className: 'space-y-4'
          },
            orders.map((order) =>
              React.createElement('div', {
                key: order.id,
                className: 'border border-gray-200 rounded-md p-4'
              }, [
                React.createElement('div', {
                  className: 'flex justify-between items-center mb-2'
                }, [
                  React.createElement('span', {
                    className: 'font-medium'
                  }, `Order #${order.id}`),
                  React.createElement('span', {
                    className: `px-2 py-1 rounded-full text-xs ${
                      order.status === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`
                  }, order.status)
                ]),
                React.createElement('div', {
                  className: 'text-sm text-gray-600'
                }, [
                  React.createElement('p', null, `Date: ${order.date}`),
                  React.createElement('p', null, `Items: ${order.items}`),
                  React.createElement('p', null, `Total: $${order.total}`)
                ]),
                React.createElement('button', {
                  className: 'mt-2 text-blue-600 hover:text-blue-800 text-sm'
                }, 'View Details')
              ])
            )
          )
        ])
      )
    ])
  ]);
}

// Make Profile available globally
window.Profile = Profile;