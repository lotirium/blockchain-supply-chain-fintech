import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { initializeAuth } from './store/slices/authSlice';

// Layout and Route Protection Components
const Layout = React.lazy(() => import('./components/Layout'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));
const SellerRoute = React.lazy(() => import('./components/SellerRoute'));
const UnverifiedSellerRoute = React.lazy(() => import('./components/UnverifiedSellerRoute'));
const AdminRoute = React.lazy(() => import('./components/AdminRoute'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));

// Page Components
const StoreSettings = React.lazy(() => import('./pages/StoreSettings'));
const Home = React.lazy(() => import('./pages/Home'));
const Products = React.lazy(() => import('./pages/Products'));
const SellerProducts = React.lazy(() => import('./pages/SellerProducts'));
const EditProduct = React.lazy(() => import('./pages/EditProduct'));
const ProductVerification = React.lazy(() => import('./pages/ProductVerification'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Orders = React.lazy(() => import('./pages/Orders'));
const AddProduct = React.lazy(() => import('./pages/AddProduct'));
const SellerDashboard = React.lazy(() => import('./pages/SellerDashboard'));
const VerificationPending = React.lazy(() => import('./pages/VerificationPending'));
const AdminVerification = React.lazy(() => import('./pages/AdminVerification'));
const AdminBlockchainDashboard = React.lazy(() => import('./pages/AdminBlockchainDashboard'));

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
          <Route path="verify" element={<ProductVerification />} />

          {/* Seller Verification Route */}
          <Route element={<UnverifiedSellerRoute />}>
            <Route path="verification-pending" element={<VerificationPending />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Product Routes */}
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            
            {/* Verified Seller Routes */}
            <Route element={<SellerRoute />}>
              <Route path="seller-dashboard" element={<SellerDashboard />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="store-settings" element={<StoreSettings />} />
              <Route path="seller-products" element={<SellerProducts />} />
              <Route path="edit-product/:id" element={<EditProduct />} />
            </Route>

            {/* Admin Routes */}
            <Route path="admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="verification" element={<AdminVerification />} />
                <Route path="blockchain" element={<AdminBlockchainDashboard />} />
              </Route>
            </Route>
            
            {/* User Routes */}
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
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