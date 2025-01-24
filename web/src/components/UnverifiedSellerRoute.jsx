import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const UnverifiedSellerRoute = () => {
  const { user } = useSelector((state) => state.auth);
  
  // Check if user is a seller
  if (user?.role !== 'seller') {
    return <Navigate to="/" replace />;
  }

  // Check store verification status
  const store = user.store;
  if (!store) {
    return <Navigate to="/" replace />;
  }

  // If store is verified and active, redirect to seller dashboard
  if (store.is_verified && store.status === 'active') {
    return <Navigate to="/seller-dashboard" replace />;
  }

  // If store is pending verification or not verified, allow access to verification pending page
  return <Outlet />;
};

export default UnverifiedSellerRoute;