import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = () => {
  const { user } = useSelector((state) => state.auth);
  
  // Check if user is an admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  // Render child routes if user is an admin
  return <Outlet />;
};

export default AdminRoute;