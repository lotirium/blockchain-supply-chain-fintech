import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

const AdminVerification = () => {
  const [pendingStores, setPendingStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchPendingStores();
  }, []);

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
        <div className="bg-white shadow-sm rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h1 className="text-lg font-medium text-gray-900">Pending Store Verifications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and verify seller store applications
            </p>
          </div>

          {/* Store List */}
          <div className="divide-y divide-gray-200">
            {pendingStores.length === 0 ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVerification;