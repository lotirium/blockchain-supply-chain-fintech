import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
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
      const response = await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap();
      
      // Navigate based on user role
      if (response.user.role === 'admin') {
        navigate('/admin/verification', { replace: true });
      } else if (response.user.role === 'seller') {
        navigate('/seller-dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Error is handled by Redux and displayed in the UI
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="w-full flex flex-col items-center justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Welcome Back</h1>
          <p className="text-xl text-blue-100 text-center mb-12">
            Sign in to access your account and continue your secure shopping experience.
          </p>
          
          {/* Feature Cards */}
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Blockchain Verified</h3>
                  <p className="text-blue-100">All products authenticated on blockchain</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Secure Shopping</h3>
                  <p className="text-blue-100">Your data is encrypted and protected</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Track Your Orders</h3>
                  <p className="text-blue-100">Real-time updates on all shipments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50">
        <div className="mx-auto w-full max-w-lg">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-lg opacity-20 rounded-full"></div>
              <span className="relative text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent z-10">
                LogiShop
              </span>
            </div>
          </div>
          
          <div className="text-center mt-6 mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Sign In to Your Account</h2>
            <p className="mt-2 text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="bg-white shadow-2xl rounded-xl p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-b from-purple-100 to-transparent rounded-bl-full opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-t from-blue-100 to-transparent rounded-tr-full opacity-70"></div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 animate-pulse">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="group">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
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
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Social Proof - Optional */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg className="h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg className="h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg className="h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.032 8l.39 1.924h-2.43L7.392 8H4.954L4.186 10H2L3.736 3.576 5.226 1.7C5.654 1.047 6.354.7 7.18.7h4.76v2.1H7.18l-.615.823-.583 1.9L12.002.6h-1.82l-1.88 4.11L7.392 8h1.64zm15.003 3.03c-.025-.229-.276-.341-.534-.341h-7.62a.473.473 0 0 0-.485.398v.04c0 .22.185.4.417.4h7.625c.245 0 .509-.108.536-.33l.06-.167zM21.998 14.4h-4.962l1.5 4.9h-3.99l-1.501-4.9h-3.097v-2.1h11.082c1.019 0 1.878.754 1.896 1.717z"/>
                  </svg>
                </button>
              </div>
            </form>

            <div className="mt-6 text-center relative z-10">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
          
          {/* Trust badges */}
          <div className="mt-10">
            <p className="text-center text-sm text-gray-500 mb-4">Trusted by companies worldwide</p>
            <div className="flex justify-center space-x-8">
              <div className="w-16 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                <div className="text-gray-500 font-semibold text-xs">COMPANY</div>
              </div>
              <div className="w-16 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                <div className="text-gray-500 font-semibold text-xs">COMPANY</div>
              </div>
              <div className="w-16 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                <div className="text-gray-500 font-semibold text-xs">COMPANY</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;