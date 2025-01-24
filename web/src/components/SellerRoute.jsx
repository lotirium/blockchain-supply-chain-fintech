import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

function SellerRoute() {
  const { user, loading } = useSelector((state) => state.auth);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user is a seller
  if (!user || user.role !== 'seller') {
    return <Navigate to="/" replace />;
  }

  // Check if user has a store
  if (!user.store) {
    return <Navigate to="/" replace />;
  }

  // Check store verification status
  if (!user.store.is_verified || user.store.status !== 'active') {
    return <Navigate to="/verification-pending" replace />;
  }
  
  // Render child routes if user is a verified seller with active store
  return <Outlet />;
}

export default SellerRoute;