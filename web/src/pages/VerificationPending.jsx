import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

const VerificationPending = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    status: 'pending',
    estimatedTime: '24-48 hours',
    lastUpdated: new Date().toISOString(),
    completedSteps: [],
    pendingSteps: [],
    supportEmail: 'support@marketplace.com'
  });

  useEffect(() => {
    let interval;
    const fetchVerificationStatus = async () => {
      if (!token) return;
      
      try {
        setError(null);
        const response = await fetch(`${API_URL}/api/verification/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch verification status');
        }

        const data = await response.json();
        setVerificationStatus(prev => ({
          ...prev,
          ...data
        }));
      } catch (error) {
        console.error('Failed to fetch verification status:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationStatus();
    // Poll for updates every 5 minutes
    interval = setInterval(fetchVerificationStatus, 5 * 60 * 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token]);

  const renderStepIcon = (status) => {
    if (status === 'completed') {
      return (
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (status === 'in_progress') {
      return (
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-gray-400" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Verification in Progress</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Status Banner */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Your seller account is being verified
                </h3>
                <p className="mt-1 text-sm text-blue-600">
                  Estimated completion time: {verificationStatus.estimatedTime}
                </p>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div key="store_name_item">
                <dt key="store_name_label" className="text-sm font-medium text-gray-500">Store Name</dt>
                <dd key="store_name_value" className="mt-1 text-sm text-gray-900">{user?.store?.name}</dd>
              </div>
              <div key="store_id_item">
                <dt key="store_id_label" className="text-sm font-medium text-gray-500">Store ID</dt>
                <dd key="store_id_value" className="mt-1 text-sm text-gray-900">#{user?.store?.id}</dd>
              </div>
            </dl>
          </div>

          {/* Verification Steps */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Progress</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-4">
                {error}
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {Array.from(new Set([...verificationStatus.completedSteps, ...verificationStatus.pendingSteps].map(step => step.id)))
                    .map(stepId => {
                      const step = [...verificationStatus.completedSteps, ...verificationStatus.pendingSteps]
                        .find(s => s.id === stepId);
                      const stepIdx = stepId - 1;
                      return (
                        <li key={`verification_step_${stepId}`}>
                          <div className="relative pb-8">
                            {stepIdx !== 3 ? (
                              <span key={`divider_${stepId}`} className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div key={`icon_${stepId}`}>{renderStepIcon(step.status)}</div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div key={`content_${stepId}`}>
                                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                                  <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>

          {/* Support Information */}
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Contact Support</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    If you have any questions about your verification status, please contact our support team at{' '}
                    <a href={`mailto:${verificationStatus.supportEmail}`} className="font-medium text-blue-600 hover:text-blue-500">
                      {verificationStatus.supportEmail}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4">
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-3 sm:mb-0"
          >
            View Profile
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Check for Updates
          </button>
        </div>
      </main>
    </div>
  );
};

export default VerificationPending;