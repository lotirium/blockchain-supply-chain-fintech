import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BlockchainProvider from './components/BlockchainProvider';
import { initializeAuth } from './store/slices/authSlice';

// Layout and Route Protection Components
const Layout = React.lazy(() => import('./components/Layout'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));
const SellerRoute = React.lazy(() => import('./components/SellerRoute'));

// Page Components
const Home = React.lazy(() => import('./pages/Home'));
const Products = React.lazy(() => import('./pages/Products'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AddProduct = React.lazy(() => import('./pages/AddProduct'));
const SellerDashboard = React.lazy(() => import('./pages/SellerDashboard'));


function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isInitialized = useSelector((state) => state.auth.initialized);

  // Initialize auth state on app start
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Show loading spinner while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          <Route path="register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Blockchain Required Routes */}
            <Route path="products" element={
              <BlockchainProvider>
                <Products />
              </BlockchainProvider>
            } />
            <Route path="products/:id" element={
              <BlockchainProvider>
                <ProductDetails />
              </BlockchainProvider>
            } />
            <Route path="cart" element={
              <BlockchainProvider>
                <Cart />
              </BlockchainProvider>
            } />
            <Route path="checkout" element={
              <BlockchainProvider>
                <Checkout />
              </BlockchainProvider>
            } />
            {/* Seller Routes */}
            <Route element={<SellerRoute />}>
              <Route path="seller-dashboard" element={<SellerDashboard />} />
              <Route path="add-product" element={
                <BlockchainProvider>
                  <AddProduct />
                </BlockchainProvider>
              } />
            </Route>
            {/* Non-Blockchain Routes */}
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-xl">Page not found</p>
            </div>
          } />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;