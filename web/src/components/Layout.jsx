import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { itemCount } = useSelector((state) => state.cart);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if a link is active
  const isActive = (path) => {
    // For exact home page match
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    // For other pages, check if the path is included in the current pathname
    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation - Redesigned */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white shadow-lg' 
          : 'bg-gradient-to-r from-primary-50 to-white'
      }`}>
        <div className="relative">
          {/* Desktop Navigation */}
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo Area */}
              <Link 
                to="/" 
                className="flex items-center group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400 blur-lg opacity-20 rounded-full group-hover:opacity-30 transition-opacity duration-300"></div>
                  <span className="relative text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent z-10">
                    LogiShop
                  </span>
                </div>
                <span className="ml-2 text-xs text-gray-500 hidden md:block">BLOCKCHAIN VERIFIED</span>
              </Link>

              {/* Main Navigation - Desktop */}
              <div className="hidden lg:flex items-center space-x-8">
                <Link 
                  to="/" 
                  className={`font-medium transition-all duration-200 relative ${
                    isActive('/') 
                      ? 'text-primary-600' 
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <span>Home</span>
                  {isActive('/') && (
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary-500 rounded-sm"></span>
                  )}
                </Link>
                <Link 
                  to="/products" 
                  className={`font-medium transition-all duration-200 relative ${
                    isActive('/products') 
                      ? 'text-primary-600' 
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <span>Products</span>
                  {isActive('/products') && (
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary-500 rounded-sm"></span>
                  )}
                </Link>
              </div>

              {/* Right Side Navigation */}
              <div className="flex items-center space-x-5">
                {/* Cart */}
                <Link 
                  to="/cart" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200 relative group p-2"
                  aria-label="Shopping Cart"
                >
                  <div className="absolute inset-0 rounded-full bg-primary-50 scale-0 group-hover:scale-100 transition-transform duration-200"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 animate-pulse">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {/* Auth Links */}
                {isAuthenticated ? (
                  <div className="hidden md:flex items-center space-x-4">
                    {user?.role === 'seller' && (
                      <Link 
                        to="/seller-dashboard" 
                        className={`font-medium transition-colors duration-200 ${
                          isActive('/seller-dashboard') 
                            ? 'text-primary-600' 
                            : 'text-gray-600 hover:text-primary-600'
                        }`}
                      >
                        Dashboard
                      </Link>
                    )}
                    <div className="relative group">
                      <Link 
                        to="/profile" 
                        className="flex items-center text-gray-600 hover:text-primary-600 transition-colors duration-200"
                      >
                        <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 mr-2">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                        <span className="font-medium">{user?.name || 'Profile'}</span>
                      </Link>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center space-x-3">
                    <Link 
                      to="/login" 
                      className="text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      Register
                    </Link>
                  </div>
                )}

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden text-gray-600 hover:text-primary-600 transition-colors p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    {mobileMenuOpen ? (
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    ) : (
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 6h16M4 12h16M4 18h16" 
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Menu */}
          <div 
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="bg-white shadow-inner px-4 py-5 space-y-4">
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/" 
                  className={`font-medium transition-colors duration-200 px-2 py-1 rounded-md ${
                    isActive('/') 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  to="/products" 
                  className={`font-medium transition-colors duration-200 px-2 py-1 rounded-md ${
                    isActive('/products') 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Products
                </Link>
              </div>

              {/* Mobile Auth Links */}
              {isAuthenticated ? (
                <div className="flex flex-col space-y-3 pt-3 border-t border-gray-200">
                  {user?.role === 'seller' && (
                    <Link 
                      to="/seller-dashboard" 
                      className={`font-medium transition-colors duration-200 px-2 py-1 rounded-md ${
                        isActive('/seller-dashboard') 
                          ? 'bg-primary-50 text-primary-600' 
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      Seller Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className={`font-medium transition-colors duration-200 px-2 py-1 rounded-md ${
                      isActive('/profile') 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/orders" 
                    className={`font-medium transition-colors duration-200 px-2 py-1 rounded-md ${
                      isActive('/orders') 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-600 hover:text-red-700 font-medium transition-colors duration-200 px-2 py-1 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 pt-3 border-t border-gray-200">
                  <Link 
                    to="/login" 
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 px-2 py-1"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-300 text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <Link to="/" className="inline-block mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-white bg-clip-text text-transparent">LogiShop</h3>
              </Link>
              <p className="text-gray-300 mb-4">
                Your one-stop shop for all your needs. Quality products at competitive prices with blockchain verification.
              </p>
              <p className="text-sm text-gray-400">
                Secure. Transparent. Verified.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-6 relative inline-block">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary-500 rounded-full"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/products" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    Cart
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    My Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact/Social */}
            <div>
              <h3 className="text-xl font-bold mb-6 relative inline-block">
                Connect With Us
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary-500 rounded-full"></span>
              </h3>
              <div className="flex space-x-4 mb-6">
                <a href="#" className="bg-gray-700 p-2 rounded-full text-gray-300 hover:text-white hover:bg-primary-600 transition-all duration-300" aria-label="Facebook">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="bg-gray-700 p-2 rounded-full text-gray-300 hover:text-white hover:bg-primary-600 transition-all duration-300" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="bg-gray-700 p-2 rounded-full text-gray-300 hover:text-white hover:bg-primary-600 transition-all duration-300" aria-label="Instagram">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.897 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.897-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </a>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Newsletter</h4>
                <p className="text-sm text-gray-300 mb-3">Stay updated with our latest products and offers</p>
                <form className="flex">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-gray-800 text-gray-200 px-3 py-2 rounded-l-lg flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                  <button 
                    type="submit" 
                    className="bg-primary-600 text-white px-3 py-2 rounded-r-lg text-sm hover:bg-primary-700 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} LogiShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;