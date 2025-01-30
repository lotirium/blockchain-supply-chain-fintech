import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminLayout from '../components/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import SellerRoute from '../components/SellerRoute';
import UnverifiedSellerRoute from '../components/UnverifiedSellerRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import CheckoutSuccess from '../pages/CheckoutSuccess';
import VerificationPending from '../pages/VerificationPending';
import AdminVerification from '../pages/AdminVerification';
import AdminBlockchainDashboard from '../pages/AdminBlockchainDashboard';
import SellerDashboard from '../pages/SellerDashboard';
import AddProduct from '../pages/AddProduct';
import StoreSettings from '../pages/StoreSettings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      },
      {
        path: 'products',
        element: <Products />
      },
      {
        path: 'products/:id',
        element: <ProductDetails />
      },
      // Unverified seller routes
      {
        element: <UnverifiedSellerRoute />,
        children: [
          {
            path: 'verification-pending',
            element: <VerificationPending />
          }
        ]
      },
      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'profile',
            element: <Profile />
          },
          {
            path: 'cart',
            element: <Cart />
          },
          {
            path: 'checkout',
            element: <Checkout />
          },
          {
            path: 'checkout/success',
            element: <CheckoutSuccess />
          }
        ]
      },
      // Seller routes (verified)
      {
        element: <SellerRoute />,
        children: [
          {
            path: 'seller-dashboard',
            element: <SellerDashboard />
          },
          {
            path: 'add-product',
            element: <AddProduct />
          },
          {
            path: 'store-settings',
            element: <StoreSettings />
          }
        ]
      },
      // Admin routes
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminVerification />  // Default admin page
              },
              {
                path: 'verification',
                element: <AdminVerification />
              },
              {
                path: 'blockchain',
                element: <AdminBlockchainDashboard />
              }
            ]
          }
        ]
      }
    ]
  }
]);

export default router;