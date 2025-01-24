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
    rememberMe: false,
    userType: location.state?.userType || 'buyer', // Default to buyer or use type from registration
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
        password: formData.password,
        userType: formData.userType
      })).unwrap();
      
      // Check the role from the response to determine redirection
      const isSellerType = response.user.role === 'manufacturer' || response.user.role === 'retailer';
      if (isSellerType && response.user.store) {
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
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-gray-600 mt-2">
              Sign in to your {formData.userType} account
            </p>
          </div>

          <div className="mb-6">
            <div className="flex justify-center space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="buyer"
                  checked={formData.userType === 'buyer'}
                  onChange={handleInputChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Buyer</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="manufacturer"
                  checked={formData.userType === 'manufacturer'}
                  onChange={handleInputChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Manufacturer</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="retailer"
                  checked={formData.userType === 'retailer'}
                  onChange={handleInputChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Retailer</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder={`${formData.userType}@example.com`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </Link>
            </div>

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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;