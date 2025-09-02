import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.4:3001';

const AdminVerification = () => {
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' or 'customers'
  const [pendingStores, setPendingStores] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchPendingStores();
    } else {
      fetchCustomers();
    }
  }, [activeTab]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verification/customers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/verification/customers/${userId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify customer email');
      }

      // Refresh the customers list
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPendingStores = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verification/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending verifications');
      }

      const data = await response.json();
      setPendingStores(data.stores);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (storeId, action) => {
    try {
      const response = await fetch(`${API_URL}/api/verification/${storeId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'active' : 'rejected',
          message: action === 'approve' 
            ? 'Your store has been verified and activated!'
            : 'Your store verification was not approved at this time.'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      // Refresh the list
      fetchPendingStores();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'stores'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Store Verification
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'customers'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Customer Management
            </button>
          </nav>
        </div>

        <div className="bg-white shadow-sm rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h1 className="text-lg font-medium text-gray-900">
              {activeTab === 'stores' ? 'Pending Store Verifications' : 'Buyer Email Verification'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'stores' 
                ? 'Review and verify seller store applications'
                : 'Manage customer accounts and email verification'
              }
            </p>
          </div>

          {/* Content */}
          <div className="divide-y divide-gray-200">
            {activeTab === 'stores' ? (
              // Stores List
              pendingStores.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No pending verifications
                </div>
              ) : (
                pendingStores.map((store) => (
                  <div key={store.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
                        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Business Email</p>
                            <p className="mt-1 text-sm text-gray-900">{store.business_email}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Business Phone</p>
                            <p className="mt-1 text-sm text-gray-900">{store.business_phone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Business Address</p>
                            <p className="mt-1 text-sm text-gray-900">{store.business_address}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Store Description</p>
                            <p className="mt-1 text-sm text-gray-900">{store.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6 flex space-x-3">
                        <button
                          onClick={() => handleVerification(store.id, 'approve')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerification(store.id, 'reject')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              // Customers List
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.first_name} {customer.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{customer.user_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            customer.is_email_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {customer.is_email_verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!customer.is_email_verified && (
                            <button
                              onClick={() => handleVerifyEmail(customer.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Verify Email
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
        </div>
      </div>
    </div>
  );
};

export default AdminVerification;