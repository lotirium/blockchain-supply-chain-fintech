import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

function SellerRoute() {
  const { user } = useSelector((state) => state.auth);
  
  // Check if user is a seller and has a store
  if (!user || user.role !== 'seller' || !user.store) {
    return <Navigate to="/" replace />;
  }
  
  // Render child routes if user is a seller with a store
  return <Outlet />;
}

export default SellerRoute;