const { Navigate, Outlet, useLocation } = ReactRouterDOM;
const { useSelector } = ReactRedux;

function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // Show loading state while checking auth
  if (loading) {
    return React.createElement('div', {
      className: 'flex items-center justify-center min-h-[60vh]'
    },
      React.createElement('div', {
        className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'
      })
    );
  }

  // Redirect to login if not authenticated, preserving the attempted route
  if (!isAuthenticated) {
    return React.createElement(Navigate, {
      to: '/login',
      state: { from: location },
      replace: true
    });
  }

  // Render child routes if authenticated
  return React.createElement(Outlet);
}

// Make ProtectedRoute available globally
window.ProtectedRoute = ProtectedRoute;