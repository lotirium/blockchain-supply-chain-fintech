import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3001';

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

  // Calculate progress percentage based on completed steps
  const calculateProgress = () => {
    const totalSteps = verificationStatus.completedSteps.length + verificationStatus.pendingSteps.length;
    if (totalSteps === 0) return 0;
    return Math.round((verificationStatus.completedSteps.length / totalSteps) * 100);
  };

  const renderStepIcon = (status) => {
    if (status === 'completed') {
      return (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-md relative group">
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-20 transform scale-110 transition-opacity duration-300"></div>
          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (status === 'in_progress') {
      return (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg relative lightning-effect">
          <div className="absolute inset-0 rounded-full bg-blue-300 opacity-30 pulse-glow"></div>
          <div className="absolute inset-0 rounded-full flash-overlay"></div>
          <svg className="h-6 w-6 text-white lightning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-sm">
        <div className="h-2 w-2 rounded-full bg-gray-400" />
      </div>
    );
  };

  const progressBg = () => {
    // Generate gradient stops based on progress
    const progress = calculateProgress();
    if (progress < 25) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (progress < 50) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    if (progress < 75) return 'bg-gradient-to-r from-indigo-500 to-purple-600';
    return 'bg-gradient-to-r from-purple-500 to-green-500';
  };
  
  // Helper to determine if a step should have the active connection line
  const getConnectionLineClass = (step, stepIdx, totalSteps) => {
    if (stepIdx === totalSteps - 1) return ''; // No line for last step
    
    if (step.status === 'completed') return 'bg-green-400';
    if (step.status === 'in_progress') return 'bg-blue-400 active-line';
    
    return 'bg-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header with animated gradient border */}
      <header className="relative bg-white shadow-md">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500 background-animate"></div>
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800 pb-1">
                Verification in Progress
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Your seller account is being verified. We'll notify you once the process is complete.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <div className="inline-flex shadow-sm rounded-md">
                <Link
                  to="/profile"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                >
                  <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Profile
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Overview */}
        <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 animate-pulse"></span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
                    <p className="text-sm text-gray-500">Estimated completion time: <span className="font-medium text-primary-700">{verificationStatus.estimatedTime}</span></p>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 bg-gray-50 px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-primary-700">{calculateProgress()}%</div>
                  <div className="ml-2 text-sm text-gray-500">Complete</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-100">
                  <div 
                    style={{ width: `${calculateProgress()}%` }} 
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressBg()} transition-all duration-500 ease-in-out`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Information */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden lg:col-span-1">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                      {user?.store?.name?.[0]?.toUpperCase() || 'S'}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Store Name</p>
                    <p className="text-sm font-medium text-gray-900">{user?.store?.name || 'Your Store'}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Store ID</p>
                    <p className="text-sm font-medium text-gray-900">#{user?.store?.id || '000000'}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Submission Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(verificationStatus.lastUpdated).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Steps/Progress */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden lg:col-span-2">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Verification Progress</h3>
                <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                  {loading ? 'Updating...' : 'Live Status'}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm text-gray-500">Fetching latest status...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-red-800">{error}</h3>
                  <p className="mt-2 text-sm text-gray-500">Please try refreshing the page or contact support.</p>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {Array.from(new Set([...verificationStatus.completedSteps, ...verificationStatus.pendingSteps].map(step => step.id)))
                      .map(stepId => {
                        const step = [...verificationStatus.completedSteps, ...verificationStatus.pendingSteps]
                          .find(s => s.id === stepId);
                        const stepIdx = stepId - 1;
                        const isCompleted = step.status === 'completed';
                        const isInProgress = step.status === 'in_progress';
                        
                        return (
                          <li key={`verification_step_${stepId}`}>
                            <div className="relative pb-8">
                              {stepIdx !== 3 ? (
                                <span 
                                  className={`absolute top-6 left-6 -ml-px h-full w-0.5 ${
                                    isCompleted 
                                      ? 'bg-green-400' 
                                      : isInProgress 
                                        ? 'bg-blue-400 line-dash-animation' 
                                        : 'bg-gray-200'
                                  } transition-colors duration-300`} 
                                  aria-hidden="true" 
                                />
                              ) : null}
                              <div className="relative flex space-x-4">
                                <div>{renderStepIcon(step.status)}</div>
                                <div className={`min-w-0 flex-1 py-1.5 ${
                                  isInProgress ? 'status-highlight' : ''
                                }`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className={`text-base font-medium ${
                                      isCompleted 
                                        ? 'text-green-700' 
                                        : isInProgress 
                                          ? 'text-blue-700' 
                                          : 'text-gray-800'
                                    }`}>
                                      {step.title}
                                    </p>
                                    {isCompleted && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Complete
                                      </span>
                                    )}
                                    {isInProgress && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">{step.description}</p>
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
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <div className="flex-shrink-0 bg-blue-600 rounded-lg p-3 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-5">
                <h3 className="text-lg font-semibold text-gray-900">Need Assistance?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Our support team is here to help you with any questions about your verification status.
                </p>
              </div>
            </div>
            
            <div className="mt-6 bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Contact Support</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Email us at{' '}
                    <a href={`mailto:${verificationStatus.supportEmail}`} className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                      {verificationStatus.supportEmail}
                    </a>{' '}
                    for assistance with your verification process.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Response Time</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    We typically respond to inquiries within 24 hours during business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4">
          <Link
            to="/profile"
            className="mb-3 sm:mb-0 inline-flex items-center justify-center px-5 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
          >
            <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            View Profile
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Check for Updates
          </button>
        </div>
      </main>

      {/* Custom CSS for animated gradient and effects */}
      <style jsx="true">{`
        .background-animate {
          background-size: 400%;
          animation: AnimateBackground 3s ease infinite;
        }
        
        @keyframes AnimateBackground {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        /* Lightning effect styles */
        .lightning-effect {
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .lightning-icon {
          animation: vibrate 1s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.7));
        }
        
        @keyframes vibrate {
          0% { transform: rotate(-3deg) scale(1); }
          50% { transform: rotate(0deg) scale(1.1); }
          100% { transform: rotate(3deg) scale(1); }
        }
        
        .flash-overlay {
          animation: flash 5s ease-out infinite;
        }
        
        @keyframes flash {
          0%, 95%, 98% {
            opacity: 0;
          }
          96%, 99% {
            opacity: 0.3;
            box-shadow: 0 0 20px 5px #4F46E5;
          }
          97%, 100% {
            opacity: 0;
          }
        }
        
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 20px rgba(59, 130, 246, 1);
          }
        }
        
        .line-dash-animation {
          background: linear-gradient(to bottom, #3B82F6 50%, transparent 50%);
          background-size: 100% 20px;
          animation: move-line 1s linear infinite;
        }
        
        @keyframes move-line {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 20px;
          }
        }
        
        .active-line {
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.7);
        }
        
        .status-highlight {
          position: relative;
          animation: highlight-pulse 3s ease-in-out infinite;
        }
        
        @keyframes highlight-pulse {
          0%, 100% {
            transform: translateY(0);
            box-shadow: 0 0 0 rgba(59, 130, 246, 0);
          }
          50% {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default VerificationPending;