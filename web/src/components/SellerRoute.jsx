import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

function SellerRoute() {
  const { user } = useSelector((state) => state.auth);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasBlockchainRole, setHasBlockchainRole] = useState(false);
  const isSellerType = user?.role === 'manufacturer' || user?.role === 'retailer';

  useEffect(() => {
    const verifyBlockchainRole = async () => {
      if (!user?.store?.wallet_address) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-role/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const { hasRole } = await response.json();
          setHasBlockchainRole(hasRole);
        } else {
          setHasBlockchainRole(false);
        }
      } catch (error) {
        console.error('Failed to verify blockchain role:', error);
        setHasBlockchainRole(false);
      }
      
      setIsVerifying(false);
    };

    if (user?.id) {
      verifyBlockchainRole();
    } else {
      setIsVerifying(false);
    }
  }, [user]);

  if (!isSellerType || !user?.store) {
    // Redirect non-sellers or sellers without store to home
    return <Navigate to="/" replace />;
  }

  // Show loading while verifying blockchain role
  if (isVerifying) {
    return <div>Verifying seller access...</div>;
  }

  // Redirect if no blockchain role
  if (!hasBlockchainRole) {
    return <Navigate to="/registration-pending" replace />;
  }
  
  // Render child routes if user is a verified seller with blockchain role
  return <Outlet />;
}

export default SellerRoute;