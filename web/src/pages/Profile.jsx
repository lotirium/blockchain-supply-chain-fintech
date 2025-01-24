import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, getProfile, clearError } from '../store/slices/authSlice';

// Placeholder components for dashboard sections
const DashboardStats = ({ stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(stats.overview).map(([key, value]) => (
        <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm uppercase">{key.replace('_', ' ')}</h3>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
    
    {/* Analytics Chart */}
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
      <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
        {/* Placeholder for chart */}
        <p className="text-gray-500">Sales trend chart will be displayed here</p>
      </div>
    </div>

    {/* Top Products */}
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
      <div className="space-y-4">
        {stats.topProducts.map((product, index) => (
          <div key={index} className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-3">
              <span className="text-gray-500">#{index + 1}</span>
              <span>{product.name}</span>
            </div>
            <span className="font-semibold">${product.revenue}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const QuickActions = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link to="/add-product" className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
        Add New Product
      </Link>
      <Link to="/orders" className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors">
        View Orders
      </Link>
      <Link to="/store-settings" className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 transition-colors">
        Store Settings
      </Link>
    </div>

    {/* Product Management */}
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Product Management</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">Price</th>
              <th className="text-left py-2">Stock</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Sample product rows */}
            <tr className="border-b">
              <td className="py-2">Sample Product 1</td>
              <td className="py-2">$99.99</td>
              <td className="py-2">15</td>
              <td className="py-2">
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="py-2">
                <button className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                <button className="text-red-600 hover:text-red-800">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const RecentOrders = ({ orders }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
    {orders.length === 0 ? (
      <p className="text-gray-500">No recent orders</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Order ID</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Amount</th>
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="py-2">{order.id.slice(0, 8)}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
      <td className="py-2">${order.totalAmount}</td>
                <td className="py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="py-2">
                  <button className="text-blue-600 hover:text-blue-800 mr-2">
                    View Details
                  </button>
                  {order.status === 'pending' && (
                    <button className="text-green-600 hover:text-green-800">
                      Mark Shipped
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const HelpSupport = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
    <h2 className="text-xl font-semibold mb-4">Help & Support</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-2">Quick Links</h3>
        <ul className="space-y-2">
          <li>
            <a href="#" className="text-blue-600 hover:text-blue-800">Seller Guidelines</a>
          </li>
          <li>
            <a href="#" className="text-blue-600 hover:text-blue-800">Shipping Instructions</a>
          </li>
          <li>
            <a href="#" className="text-blue-600 hover:text-blue-800">FAQ</a>
          </li>
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-2">Contact Support</h3>
        <p className="text-gray-600 mb-2">Need help? Our support team is available 24/7</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  </div>
);

function Profile() {
  const [isSellerView, setIsSellerView] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error, initialized, lastProfileFetch } = useSelector((state) => state.auth);

  // Mock data for demonstration
  const mockStats = {
    overview: {
      total_orders: 25,
      active_orders: 5,
      total_sales: '$2,450'
    },
    topProducts: [
      { name: 'Product A', revenue: '1,200' },
      { name: 'Product B', revenue: '850' },
      { name: 'Product C', revenue: '650' }
    ]
  };

  const mockOrders = [
    {
      id: '12345678-1234-5678-1234-567812345678',
      status: 'pending',
      totalAmount: '150.00',
      createdAt: '2024-01-22T10:00:00Z'
    },
    {
      id: '87654321-8765-4321-8765-432187654321',
      status: 'completed',
      totalAmount: '299.99',
      createdAt: '2024-01-21T15:30:00Z'
    }
  ];

  const [formData, setFormData] = useState({
    storeName: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    if (initialized && (!user || !lastProfileFetch || 
        (Date.now() - lastProfileFetch) >= 5 * 60 * 1000)) {
      dispatch(getProfile());
    }
  }, [dispatch, initialized, user, lastProfileFetch]);

  useEffect(() => {
    if (user) {
      const [firstName, ...lastNameParts] = (user.username || '').split(' ');
      setFormData({
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || '',
        email: user.email || '',
        storeName: user.store?.name || ''
      });
      setIsSellerView(user.role === 'seller');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(updateProfile({
        username: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        storeName: formData.storeName
      })).unwrap();
      
      dispatch({
        type: 'auth/getProfile/fulfilled',
        payload: {
          data: result,
          fromCache: false,
          fetchTime: Date.now()
        }
      });
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  const renderProfileForm = () => (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-gray-600 mt-2">
              Update your profile information
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isSellerView && (
              <div>
                <label
                  htmlFor="storeName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Store Name
                </label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}



            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white px-6 py-3 rounded-md ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700 transition-colors'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating Profile...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderSellerDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {formData.firstName}!</h1>
        <p className="text-gray-600">
          {formData.storeName ? `Managing ${formData.storeName}` : 'Set up your store to start selling'}
        </p>
      </div>

      <DashboardStats stats={mockStats} />
      <QuickActions />
      <RecentOrders orders={mockOrders} />
      <HelpSupport />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {isSellerView ? (
        <div>
          {renderSellerDashboard()}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
            {renderProfileForm()}
          </div>
        </div>
      ) : (
        renderProfileForm()
      )}
    </>
  );
}

export default Profile;