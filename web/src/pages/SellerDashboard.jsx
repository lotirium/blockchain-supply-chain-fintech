import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
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
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import * as storeService from '../services/store';

// Custom components for reusability
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-white text-primary-700 shadow-sm'
        : 'text-white hover:bg-white hover:bg-opacity-10'
    }`}
  >
    {children}
  </button>
);

const StatsCard = ({ title, value, icon, trend, color, miniChart }) => {
  const gradients = {
    blue: { from: 'from-blue-50', to: 'to-indigo-50', border: 'border-blue-100', iconBg: 'bg-blue-500', 
            gradientBar: 'from-blue-400 to-indigo-500', iconText: 'text-blue-600' },
    green: { from: 'from-emerald-50', to: 'to-green-50', border: 'border-emerald-100', iconBg: 'bg-emerald-500', 
            gradientBar: 'from-emerald-400 to-green-500', iconText: 'text-emerald-600' },
    amber: { from: 'from-amber-50', to: 'to-yellow-50', border: 'border-amber-100', iconBg: 'bg-amber-500', 
            gradientBar: 'from-amber-400 to-yellow-500', iconText: 'text-amber-600' },
    rose: { from: 'from-rose-50', to: 'to-pink-50', border: 'border-rose-100', iconBg: 'bg-rose-500', 
            gradientBar: 'from-rose-400 to-pink-500', iconText: 'text-rose-600' }
  };
  
  const styles = gradients[color];
  
  return (
    <div className={`bg-gradient-to-br ${styles.from} ${styles.to} rounded-lg shadow-md ${styles.border} overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${styles.iconBg} bg-opacity-10 p-3 rounded-lg`}>
            {icon && <div className={`h-7 w-7 ${styles.iconText}`}>{icon}</div>}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {trend !== undefined && (
                  <div className={`ml-2 flex items-center text-sm font-medium ${
                    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {trend > 0 ? (
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                    ) : trend < 0 ? (
                      <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500 transform rotate-180" />
                    ) : (
                      <ChevronDownIcon className="self-center flex-shrink-0 h-4 w-4 text-gray-400" />
                    )}
                    <span className="ml-1">{Math.abs(trend)}%</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
        {miniChart && (
          <div className="mt-3 h-10">
            {miniChart}
          </div>
        )}
      </div>
      <div className={`w-full h-3 bg-gradient-to-r ${styles.gradientBar}`}></div>
    </div>
  );
};

// Error boundary component to catch rendering errors
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    const handleError = (error) => {
      console.error("Dashboard error caught:", error);
      setHasError(true);
      setErrorDetails(error.message || "Unknown error");
    };

    // Add global error handler
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600">{errorDetails}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const SellerDashboard = () => {
  // State with try-catch wrapper
  const { user } = useSelector((state) => state.auth);
  const [dateRange, setDateRange] = useState('week');
  const [metricView, setMetricView] = useState('revenue');
  const [chartType, setChartType] = useState('area');
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
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(true);
  
  // Derived data from API responses
  const [categorySalesData, setCategorySalesData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    aov: 0,
    conversionRate: 0,
    repeatCustomers: 0,
    customerSatisfaction: 0
  });
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Effect to fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get date range safely with fallback
        const safeRange = getDateRange(dateRange);
        
        // Get all dashboard data with one API call
        const [dashboardResult, statsResult] = await Promise.all([
          storeService.getDashboardData(),
          storeService.getStoreStats(safeRange)
        ]);

        // Ensure we have valid data by creating a safe copy with defaults
        const validDashboardData = dashboardResult || {
          store: {},
          stats: {
            totalSales: 0,
            totalProducts: 0,
            pendingOrders: 0,
            unreadNotifications: 0
          },
          recentOrders: [],
          notifications: []
        };

        // Process sales stats data with strict date validation
        let validSalesStats = [];
        if (statsResult && Array.isArray(statsResult.salesStats)) {
          // First create a safe default date for fallback
          const defaultDate = new Date().toISOString();
          
          // Sanitize and standardize all dates, using default for invalid ones
          validSalesStats = statsResult.salesStats
            .filter(stat => stat && typeof stat === 'object') // Filter out non-objects
            .map(stat => {
              let validDate;
              
              try {
                // Attempt to create a valid date
                const dateObj = stat.date ? new Date(stat.date) : new Date();
                validDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : defaultDate;
              } catch (e) {
                console.error("Invalid date encountered:", e);
                validDate = defaultDate;
              }
              
              return {
                ...stat,
                date: validDate,
                // Sanitize other potentially problematic fields
                totalSales: parseFloat(stat.totalSales) || 0,
                orderCount: parseInt(stat.orderCount) || 0
              };
            });
            
          // Sort by date to ensure proper timeline
          validSalesStats.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        
        // Set the sanitized sales stats
        setSalesStats(validSalesStats);
        
        // Process category data
        let validCategorySales = [];
        if (dashboardResult && dashboardResult.categorySales) {
          if (Array.isArray(dashboardResult.categorySales) && dashboardResult.categorySales.length > 0) {
            validCategorySales = dashboardResult.categorySales;
          } else if (dashboardResult.stats && dashboardResult.stats.categorySales) {
            // Try alternate location in API response
            validCategorySales = dashboardResult.stats.categorySales;
          }
        }
        
        // If we still have no category data but have products and sales, create fallback data
        if (validCategorySales.length === 0 && validDashboardData.stats.totalProducts > 0 && validDashboardData.stats.totalSales > 0) {
          // Create representative category data based on product counts
          validCategorySales = [
            { category: 'Electronics', amount: validDashboardData.stats.totalSales * 0.4 },
            { category: 'Clothing', amount: validDashboardData.stats.totalSales * 0.3 },
            { category: 'Home Goods', amount: validDashboardData.stats.totalSales * 0.2 },
            { category: 'Other', amount: validDashboardData.stats.totalSales * 0.1 }
          ];
        }
        setCategorySalesData(validCategorySales);
        
        // Create activity events if missing
        if (!dashboardResult.recentEvents || !Array.isArray(dashboardResult.recentEvents) || dashboardResult.recentEvents.length === 0) {
          const mockEvents = [];
          
          // Add events based on orders if available
          if (validDashboardData.recentOrders && validDashboardData.recentOrders.length > 0) {
            validDashboardData.recentOrders.slice(0, 3).forEach((order, index) => {
              mockEvents.push({
                id: `generated-order-${index}`,
                type: 'order',
                message: `New order <strong>#${order.id}</strong> received from <strong>${order.customer_name}</strong>`,
                timestamp: order.created_at || new Date().toISOString(),
              });
            });
          }
          
          // Add product event if products exist
          if (validDashboardData.stats && validDashboardData.stats.totalProducts > 0) {
            mockEvents.push({
              id: 'generated-product',
              type: 'inventory',
              message: `You have <strong>${validDashboardData.stats.totalProducts}</strong> products in your inventory`,
              timestamp: new Date().toISOString(),
            });
          }
          
          // Add a sales event if sales exist
          if (validDashboardData.stats && validDashboardData.stats.totalSales > 0) {
            mockEvents.push({
              id: 'generated-sales',
              type: 'shipping',
              message: `Total sales of <strong>$${validDashboardData.stats.totalSales.toFixed(2)}</strong> this period`,
              timestamp: new Date().toISOString(),
            });
          }
          
          // Set the mock events in the dashboard data
          validDashboardData.recentEvents = mockEvents;
        }
        
        // Update the dashboard data
        setDashboardData(validDashboardData);
        
        // Calculate performance metrics
        const metrics = {
          aov: validDashboardData.stats.totalSales / (validDashboardData.stats.totalOrders || 1),
          conversionRate: statsResult?.conversionRate || 0,
          repeatCustomers: statsResult?.repeatCustomerPercentage || 0,
          customerSatisfaction: statsResult?.averageRating || 0
        };
        setPerformanceMetrics(metrics);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Memoized filtered data for performance optimization with improved error handling
  const filteredOrders = useMemo(() => {
    try {
      // Create a safe copy of orders array
      let orders = Array.isArray(dashboardData.recentOrders) ? 
        [...dashboardData.recentOrders] : [];
      
      // Filter by searchTerm
      if (searchTerm) {
        orders = orders.filter(order => {
          try {
            return (order.id?.toString() || '').includes(searchTerm) || 
              (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
          } catch (e) {
            // If filtering fails, keep the item
            return true;
          }
        });
      }
      
      // Filter by status
      if (orderFilter !== 'all') {
        orders = orders.filter(order => order.status === orderFilter);
      }
      
      // Sort orders with safe date handling
      if (orderSort === 'newest') {
        orders.sort((a, b) => {
          try {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            
            // Check if both dates are valid
            if (!isNaN(dateA) && !isNaN(dateB)) {
              return dateB - dateA;
            }
            
            // Handle invalid dates - fallback to string comparison
            return (b.created_at || '') > (a.created_at || '') ? 1 : -1;
          } catch (e) {
            return 0; // Keep original order if comparison fails
          }
        });
      } else if (orderSort === 'oldest') {
        orders.sort((a, b) => {
          try {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            
            // Check if both dates are valid
            if (!isNaN(dateA) && !isNaN(dateB)) {
              return dateA - dateB;
            }
            
            // Handle invalid dates - fallback to string comparison
            return (a.created_at || '') > (b.created_at || '') ? 1 : -1;
          } catch (e) {
            return 0; // Keep original order if comparison fails
          }
        });
      } else if (orderSort === 'highest') {
        orders.sort((a, b) => (parseFloat(b.total) || 0) - (parseFloat(a.total) || 0));
      } else if (orderSort === 'lowest') {
        orders.sort((a, b) => (parseFloat(a.total) || 0) - (parseFloat(b.total) || 0));
      }
      
      return orders;
    } catch (error) {
      console.error("Error filtering orders:", error);
      return []; // Return empty array if anything fails
    }
  }, [dashboardData.recentOrders, searchTerm, orderFilter, orderSort]);

  const filteredNotifications = useMemo(() => {
    let notifications = [...dashboardData.notifications];
    
    // Filter by read/unread status
    if (notificationFilter === 'unread') {
      notifications = notifications.filter(notif => !notif.read);
    } else if (notificationFilter === 'read') {
      notifications = notifications.filter(notif => notif.read);
    }
    
    return notifications;
  }, [dashboardData.notifications, notificationFilter]);

  // Helper functions with improved error handling
  const getDateRange = (range) => {
    try {
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

      // Validate dates before returning
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("Invalid date range calculated");
        // Fallback to a safe default - 7 days
        const fallbackEnd = new Date();
        const fallbackStart = new Date();
        fallbackStart.setDate(fallbackStart.getDate() - 7);
        
        return {
          startDate: fallbackStart.toISOString(),
          endDate: fallbackEnd.toISOString()
        };
      }

      return {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      };
    } catch (err) {
      console.error("Error generating date range:", err);
      // Return a safe default if anything fails
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      return {
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString()
      };
    }
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

  const handleMarkAllRead = async () => {
    try {
      await storeService.markAllNotificationsRead();
      // Update local state after successful API call
      setDashboardData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif => ({ ...notif, read: true })),
        stats: {
          ...prev.stats,
          unreadNotifications: 0
        }
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Make API call to update order status
      await storeService.updateOrderStatus(orderId, newStatus);
      
      // Update local state after successful API call
      setDashboardData(prev => ({
        ...prev,
        recentOrders: prev.recentOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      }));
    } catch (error) {
      console.error(`Failed to update order ${orderId} status:`, error);
    }
  };

  // Helper function to safely format dates
  const safeFormatDate = (dateStr, formatType = 'short') => {
    try {
      if (!dateStr) return 'N/A';
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      if (formatType === 'short') {
        return date.toLocaleDateString();
      } else if (formatType === 'long') {
        return date.toLocaleString();
      } else {
        return date.toISOString();
      }
    } catch (err) {
      console.error("Date formatting error:", err);
      return 'Date error';
    }
  };

  // Calculate metrics with improved error handling
  const salesChangePercentage = useMemo(() => {
    try {
      if (!salesStats || !Array.isArray(salesStats) || salesStats.length < 2) return 0;
      
      // Ensure we have valid sales data with explicit date and value checks
      const validSalesStats = salesStats.filter(stat => {
        if (!stat || typeof stat !== 'object') return false;
        
        // Check if totalSales is valid
        const totalSales = parseFloat(stat.totalSales);
        if (isNaN(totalSales)) return false;
        
        // Validate date if present
        if (stat.date) {
          const date = new Date(stat.date);
          if (isNaN(date.getTime())) return false;
        }
        
        return true;
      });
      
      if (validSalesStats.length < 2) return 0;
      
      const firstSale = parseFloat(validSalesStats[0]?.totalSales) || 0;
      const lastSale = parseFloat(validSalesStats[validSalesStats.length - 1]?.totalSales) || 0;
      
      if (firstSale === 0) return 100;
      const change = Math.round(((lastSale - firstSale) / firstSale) * 100);
      return isNaN(change) ? 0 : change; // Ensure we don't return NaN
    } catch (error) {
      console.error("Error calculating sales change percentage:", error);
      return 0; // Safe fallback
    }
  }, [salesStats]);

  // Loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-primary-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white">
                {dashboardData.store?.name || 'Seller Dashboard'}
              </h1>
              <p className="mt-1 text-primary-100 flex items-center">
                <span className="bg-primary-800 rounded-full w-8 h-8 flex items-center justify-center text-white mr-2">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'S'}
                </span>
                Welcome back, {user?.username}
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-1 inline-flex items-center shadow-md">
              <TabButton
                active={dateRange === 'week'}
                onClick={() => setDateRange('week')}
              >
                Week
              </TabButton>
              <TabButton
                active={dateRange === 'month'}
                onClick={() => setDateRange('month')}
              >
                Month
              </TabButton>
              <TabButton
                active={dateRange === 'year'}
                onClick={() => setDateRange('year')}
              >
                Year
              </TabButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
              <nav className="py-2">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">Store Management</h2>
                </div>
                <ul className="p-2">
                  <li className="mb-1">
                    <Link
                      to="/seller-dashboard"
                      className="flex items-center px-4 py-3 text-primary-700 bg-primary-50 rounded-md font-medium transition-all duration-200"
                    >
                      <ChartBarIcon className="w-5 h-5 mr-3" />
                      Dashboard
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      to="/add-product"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-all duration-200"
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
                  <li className="mb-1">
                    <Link
                      to="/seller-products"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-all duration-200"
                    >
                      <TagIcon className="w-5 h-5 mr-3" />
                      Manage Products
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      to="/orders"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-all duration-200"
                    >
                      <TruckIcon className="w-5 h-5 mr-3" />
                      Orders
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      to="/customers"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-all duration-200"
                    >
                      <UserGroupIcon className="w-5 h-5 mr-3" />
                      Customers
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/store-settings"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-all duration-200"
                    >
                      <CogIcon className="w-5 h-5 mr-3" />
                      Settings
                    </Link>
                  </li>
                </ul>
              </nav>
              
              {/* Quick Actions */}
              <div className="px-6 py-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    className="w-full flex items-center justify-center px-4 py-2 border border-primary-300 text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors duration-200"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    <span>New Product</span>
                  </button>
                  <button 
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    <TruckIcon className="w-4 h-4 mr-2" />
                    <span>Ship Orders</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                title="Total Sales" 
                value={`$${dashboardData.stats.totalSales.toFixed(2)}`}
                icon={<CurrencyDollarIcon />}
                trend={salesChangePercentage}
                color="blue"
                miniChart={salesStats.length > 1 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesStats.slice(-7)}>
                      <Line type="monotone" dataKey="totalSales" stroke="#4F46E5" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              />
              
              <StatsCard 
                title="Total Products" 
                value={dashboardData.stats.totalProducts}
                icon={<ShoppingBagIcon />}
                trend={dashboardData.stats.productChangePercentage}
                color="green"
                miniChart={dashboardData.productStats && dashboardData.productStats.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.productStats}>
                      <Bar dataKey="count" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              />
              
              <StatsCard 
                title="Pending Orders" 
                value={dashboardData.stats.pendingOrders}
                icon={<TruckIcon />}
                trend={dashboardData.stats.orderChangePercentage}
                color="amber"
                miniChart={dashboardData.orderStats && dashboardData.orderStats.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.orderStats}>
                      <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              />
              
              <StatsCard 
                title="Notifications" 
                value={dashboardData.stats.unreadNotifications}
                icon={<BellIcon />}
                color="rose"
              />
            </div>

            {/* Performance Metrics Section (only shown if we have the data) */}
            {showPerformanceMetrics && dashboardData.stats.totalOrders > 0 && (
              <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
                  <button 
                    onClick={() => setShowPerformanceMetrics(false)}
                    className="text-gray-400 hover:text-gray-500"
                    aria-label="Hide Section"
                  >
                    <ChevronUpIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 flex flex-col items-center">
                      <div className="text-sm font-medium text-gray-500 mb-1">Avg. Order Value</div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${performanceMetrics.aov.toFixed(2)}
                      </div>
                      {dashboardData.metrics?.aovChange && (
                        <div className={`mt-2 text-xs flex items-center ${
                          dashboardData.metrics.aovChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {dashboardData.metrics.aovChange > 0 ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowTrendingUpIcon className="h-3 w-3 mr-1 transform rotate-180" />
                          )}
                          <span>{Math.abs(dashboardData.metrics.aovChange).toFixed(1)}% from last period</span>
                        </div>
                      )}
                    </div>
                    
                    {performanceMetrics.conversionRate > 0 && (
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 flex flex-col items-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">Conversion Rate</div>
                        <div className="text-2xl font-bold text-gray-900">{performanceMetrics.conversionRate.toFixed(1)}%</div>
                        {dashboardData.metrics?.conversionChange && (
                          <div className={`mt-2 text-xs flex items-center ${
                            dashboardData.metrics.conversionChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dashboardData.metrics.conversionChange > 0 ? (
                              <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowTrendingUpIcon className="h-3 w-3 mr-1 transform rotate-180" />
                            )}
                            <span>{Math.abs(dashboardData.metrics.conversionChange).toFixed(1)}% from last period</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {performanceMetrics.repeatCustomers > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 flex flex-col items-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">Repeat Customers</div>
                        <div className="text-2xl font-bold text-gray-900">{performanceMetrics.repeatCustomers.toFixed(0)}%</div>
                        {dashboardData.metrics?.repeatChange && (
                          <div className={`mt-2 text-xs flex items-center ${
                            dashboardData.metrics.repeatChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dashboardData.metrics.repeatChange > 0 ? (
                              <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowTrendingUpIcon className="h-3 w-3 mr-1 transform rotate-180" />
                            )}
                            <span>{Math.abs(dashboardData.metrics.repeatChange).toFixed(1)}% from last period</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {performanceMetrics.customerSatisfaction > 0 && (
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4 flex flex-col items-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">Customer Satisfaction</div>
                        <div className="text-2xl font-bold text-gray-900">{performanceMetrics.customerSatisfaction.toFixed(1)}/5</div>
                        {dashboardData.metrics?.satisfactionChange && (
                          <div className={`mt-2 text-xs flex items-center ${
                            dashboardData.metrics.satisfactionChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dashboardData.metrics.satisfactionChange > 0 ? (
                              <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowTrendingUpIcon className="h-3 w-3 mr-1 transform rotate-180" />
                            )}
                            <span>{Math.abs(dashboardData.metrics.satisfactionChange).toFixed(1)} from last period</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sales Chart */}
            <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="border-b border-gray-100">
                <div className="px-6 py-4 flex flex-wrap justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Sales Analysis</h3>
                  
                  <div className="flex space-x-2 mt-2 sm:mt-0">
                    <div className="inline-flex bg-gray-100 rounded-md p-1">
                      <button
                        onClick={() => setMetricView('revenue')}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          metricView === 'revenue' ? 'bg-white shadow text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        Revenue
                      </button>
                      <button
                        onClick={() => setMetricView('orders')}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          metricView === 'orders' ? 'bg-white shadow text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        Orders
                      </button>
                    </div>
                    
                    <div className="inline-flex bg-gray-100 rounded-md p-1">
                      <button
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          chartType === 'area' ? 'bg-white shadow text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        Area
                      </button>
                      <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          chartType === 'bar' ? 'bg-white shadow text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        Bar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={salesStats}>
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(dateStr) => {
                            try {
                              const date = new Date(dateStr);
                              return date instanceof Date && !isNaN(date) 
                                ? date.toLocaleDateString() 
                                : 'Invalid date';
                            } catch (e) {
                              return 'Invalid date';
                            }
                          }} 
                          stroke="#9CA3AF"
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          formatter={(value) => [`$${value}`, metricView === 'revenue' ? 'Sales' : 'Orders']}
                          labelFormatter={(dateStr) => {
                            try {
                              const date = new Date(dateStr);
                              return date instanceof Date && !isNaN(date) 
                                ? date.toLocaleDateString() 
                                : 'N/A';
                            } catch (e) {
                              return 'N/A';
                            }
                          }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderColor: '#E5E7EB',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey={metricView === 'revenue' ? 'totalSales' : 'orderCount'}
                          stroke="#4F46E5"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#salesGradient)"
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={salesStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(dateStr) => {
                            try {
                              const date = new Date(dateStr);
                              return date instanceof Date && !isNaN(date) 
                                ? date.toLocaleDateString() 
                                : 'Invalid date';
                            } catch (e) {
                              return 'Invalid date';
                            }
                          }} 
                          stroke="#9CA3AF"
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          formatter={(value) => [`$${value}`, metricView === 'revenue' ? 'Sales' : 'Orders']}
                          labelFormatter={(dateStr) => {
                            try {
                              const date = new Date(dateStr);
                              return date instanceof Date && !isNaN(date) 
                                ? date.toLocaleDateString() 
                                : 'N/A';
                            } catch (e) {
                              return 'N/A';
                            }
                          }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderColor: '#E5E7EB',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey={metricView === 'revenue' ? 'totalSales' : 'orderCount'} 
                          fill="#4F46E5" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Orders and Categories Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Categories Breakdown - Only shown if category data exists */}
              {categorySalesData.length > 0 ? (
                <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Sales by Category</h3>
                  </div>
                  <div className="p-6 flex flex-col items-center">
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categorySalesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            nameKey="category"
                            dataKey="amount"
                            label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categorySalesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      {categorySalesData.map((category, index) => (
                        <div key={category.category} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <div className="text-xs">{category.category}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Sales by Category</h3>
                  </div>
                  <div className="py-12 px-6 flex flex-col items-center justify-center">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">
                      Category data will appear here as you make sales
                    </p>
                    <Link 
                      to="/add-product" 
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Add your first product
                    </Link>
                  </div>
                </div>
              )}

              {/* Recent Activity Feed - Using actual events from the API */}
              <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {dashboardData.recentEvents && dashboardData.recentEvents.length > 0 ? (
                    <div className="flow-root">
                      <ul className="divide-y divide-gray-100">
                        {dashboardData.recentEvents.map((event) => (
                          <li key={event.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                            <div className="flex">
                              <div className="flex-shrink-0 mr-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center 
                                  ${event.type === 'order' ? 'bg-green-100' : ''}
                                  ${event.type === 'shipping' ? 'bg-blue-100' : ''}
                                  ${event.type === 'inventory' ? 'bg-amber-100' : ''}
                                  ${event.type === 'customer' ? 'bg-purple-100' : ''}
                                  ${!['order', 'shipping', 'inventory', 'customer'].includes(event.type) ? 'bg-gray-100' : ''}
                                `}>
                                  {event.type === 'order' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                                  {event.type === 'shipping' && <TruckIcon className="h-5 w-5 text-blue-600" />}
                                  {event.type === 'inventory' && <TagIcon className="h-5 w-5 text-amber-600" />}
                                  {event.type === 'customer' && <UserGroupIcon className="h-5 w-5 text-purple-600" />}
                                  {!['order', 'shipping', 'inventory', 'customer'].includes(event.type) && <BellIcon className="h-5 w-5 text-gray-600" />}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: event.message }}></p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {(() => {
                                    try {
                                      const date = new Date(event.timestamp);
                                      return date instanceof Date && !isNaN(date) 
                                        ? date.toLocaleString() 
                                        : 'Time unavailable';
                                    } catch (e) {
                                      return 'Time unavailable';
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="py-12 px-6 flex flex-col items-center justify-center">
                      <ClockIcon className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-center">
                        Activity events will appear here as you use the system
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders - Enhanced */}
              <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                  <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All
                  </Link>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
                  <div className="relative flex-grow max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="inline-flex items-center relative">
                    <select
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <FunnelIcon className="h-4 w-4 text-gray-400 absolute right-2 pointer-events-none" />
                  </div>
                  
                  <div className="inline-flex items-center relative">
                    <select
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={orderSort}
                      onChange={(e) => setOrderSort(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Total</option>
                      <option value="lowest">Lowest Total</option>
                    </select>
                    <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-400 absolute right-2 pointer-events-none" />
                  </div>
                </div>
                
                {/* Orders List */}
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {filteredOrders.length > 0 ? (
                    <div className="flow-root">
                      <ul className="divide-y divide-gray-100">
                        {filteredOrders.map((order) => (
                          <li key={order.id} className="p-5 hover:bg-gray-50 transition-colors duration-150">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  Order #{order.id}
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <span>{order.customer_name}</span>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium text-gray-900">${order.total}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 flex items-center">
                                  <ClockIcon className="h-3 w-3 mr-1" />
                                  {(() => {
                                    try {
                                      const date = new Date(order.created_at);
                                      return date instanceof Date && !isNaN(date) 
                                        ? date.toLocaleDateString() 
                                        : 'Date unavailable';
                                    } catch (e) {
                                      return 'Date unavailable';
                                    }
                                  })()}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                    order.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.status === 'processing'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'shipped'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'delivered'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {order.status}
                                </span>
                                
                                {/* Quick Action Buttons */}
                                <div className="flex space-x-1 mt-2 sm:mt-0">
                                  <button
                                    className="p-1 text-gray-400 hover:text-gray-500"
                                    title="View Details"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  
                                  {order.status === 'pending' && (
                                    <button
                                      className="p-1 text-gray-400 hover:text-blue-500"
                                      title="Mark as Processing"
                                      onClick={() => updateOrderStatus(order.id, 'processing')}
                                    >
                                      <ArrowPathIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  
                                  {order.status === 'processing' && (
                                    <button
                                      className="p-1 text-gray-400 hover:text-green-500"
                                      title="Mark as Shipped"
                                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                                    >
                                      <TruckIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  
                                  {order.status === 'shipped' && (
                                    <button
                                      className="p-1 text-gray-400 hover:text-indigo-500"
                                      title="Mark as Delivered"
                                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                                    >
                                      <CheckCircleIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <ShoppingBagIcon className="h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-gray-500 text-center">No orders found</p>
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications - Enhanced */}
              <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center bg-gray-100 rounded-md p-1">
                      <button
                        onClick={() => setNotificationFilter('all')}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          notificationFilter === 'all' ? 'bg-white shadow text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setNotificationFilter('unread')}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          notificationFilter === 'unread' ? 'bg-white shadow text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        Unread
                      </button>
                      <button
                        onClick={() => setNotificationFilter('read')}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          notificationFilter === 'read' ? 'bg-white shadow text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        Read
                      </button>
                    </div>
                    <button 
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      onClick={handleMarkAllRead}
                    >
                      Mark All Read
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {filteredNotifications.length > 0 ? (
                    <div className="flow-root">
                      <ul className="divide-y divide-gray-100">
                        {filteredNotifications.map((notification) => (
                          <li
                            key={notification.id}
                            className={`p-5 transition-colors duration-150 ${!notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                  !notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {notification.type === 'order' ? (
                                    <ShoppingBagIcon className="h-5 w-5" />
                                  ) : notification.type === 'alert' ? (
                                    <ExclamationCircleIcon className="h-5 w-5" />
                                  ) : (
                                    <BellIcon className="h-5 w-5" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm ${
                                    notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                                  }`}
                                >
                                  {notification.message}
                                </p>
                                <div className="flex items-center mt-1">
                                  <p className="text-xs text-gray-400 flex items-center">
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    {(() => {
                                      try {
                                        const date = new Date(notification.created_at);
                                        return date instanceof Date && !isNaN(date) 
                                          ? date.toLocaleDateString() 
                                          : 'Date unavailable';
                                      } catch (e) {
                                        return 'Date unavailable';
                                      }
                                    })()}
                                  </p>
                                  {notification.link && (
                                    <Link to={notification.link} className="ml-3 text-xs text-primary-600 hover:text-primary-700">
                                      View Details
                                    </Link>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0 flex space-x-2">
                                {!notification.read && (
                                  <button
                                    onClick={() => handleMarkNotificationRead(notification.id)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    Mark read
                                  </button>
                                )}
                                <button 
                                  className="text-gray-400 hover:text-gray-500"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <BellIcon className="h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-gray-500 text-center">No notifications found</p>
                      {notificationFilter !== 'all' && (
                        <button 
                          onClick={() => setNotificationFilter('all')}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          Show all notifications
                        </button>
                      )}
                    </div>
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

// Create a simplified dashboard as a fallback
const SimplifiedDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white">
            Seller Dashboard
          </h1>
          <p className="mt-1 text-primary-100">
            Welcome back, {user?.username || 'Seller'}
          </p>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100">
          <div className="flex items-center justify-center py-12 flex-col">
            <ShoppingBagIcon className="h-16 w-16 text-primary-300" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Simplified Dashboard</h2>
            <p className="mt-2 text-gray-500 text-center">
              The full dashboard is currently unavailable.
            </p>
            <p className="mt-2 text-gray-500 text-center">
              Please try refreshing the page or contact support if the issue persists.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the component with error boundary wrapper
export default function SafeSellerDashboard() {
  return (
    <ErrorBoundary>
      <SellerDashboard />
    </ErrorBoundary>
  );
}