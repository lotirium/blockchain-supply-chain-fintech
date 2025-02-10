import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  PlusIcon,
  CogIcon,
  TagIcon,
  TruckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import * as storeService from '../services/store';

const SellerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dateRange, setDateRange] = useState('week');
  const [dashboardData, setDashboardData] = useState({
    store: {},
    stats: {
      totalSales: 0,
      totalProducts: 0,
      pendingOrders: 0,
      unreadNotifications: 0
    },
    recentOrders: [],
    notifications: []
  });
  const [salesStats, setSalesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardResult, statsResult] = await Promise.all([
          storeService.getDashboardData(),
          storeService.getStoreStats(getDateRange(dateRange))
        ]);

        setDashboardData(dashboardResult);
        setSalesStats(statsResult.salesStats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await storeService.markNotificationRead(notificationId);
      setDashboardData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        ),
        stats: {
          ...prev.stats,
          unreadNotifications: prev.stats.unreadNotifications - 1
        }
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {dashboardData.store?.name || 'Seller Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user?.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDateRange('week')}
                className={`px-3 py-1 rounded-md text-sm ${
                  dateRange === 'week'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-3 py-1 rounded-md text-sm ${
                  dateRange === 'month'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setDateRange('year')}
                className={`px-3 py-1 rounded-md text-sm ${
                  dateRange === 'year'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 bg-white rounded-lg shadow">
            <nav className="px-4 py-5">
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/seller-dashboard"
                    className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md"
                  >
                    <ChartBarIcon className="w-5 h-5 mr-3" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/add-product"
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={(e) => {
                      if (loading) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <PlusIcon className="w-5 h-5 mr-3" />
                    {loading ? 'Loading...' : 'Add Product'}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/seller-products"
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <TagIcon className="w-5 h-5 mr-3" />
                    Manage Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/orders"
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <TruckIcon className="w-5 h-5 mr-3" />
                    Orders
                  </Link>
                </li>
                <li>
                  <Link
                    to="/customers"
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <UserGroupIcon className="w-5 h-5 mr-3" />
                    Customers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/store-settings"
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <CogIcon className="w-5 h-5 mr-3" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${dashboardData.stats.totalSales.toFixed(2)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.stats.totalProducts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TruckIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.stats.pendingOrders}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BellIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Notifications</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.stats.unreadNotifications}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`$${value}`, 'Sales']}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalSales"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {dashboardData.recentOrders.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-my-5 divide-y divide-gray-200">
                        {dashboardData.recentOrders.map((order) => (
                          <li key={order.id} className="py-5">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  Order #{order.id}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {order.customer_name} • ${order.total}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.status === 'shipped'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent orders</p>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {dashboardData.notifications.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-my-5 divide-y divide-gray-200">
                        {dashboardData.notifications.map((notification) => (
                          <li
                            key={notification.id}
                            className={`py-5 ${!notification.read ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <BellIcon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm ${
                                    notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                                  }`}
                                >
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkNotificationRead(notification.id)}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No new notifications</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;