import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

const RoleProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // Add debugging
  useEffect(() => {
    console.log('RoleProtectedRoute state:', { 
      user, 
      isAuthenticated, 
      loading, 
      allowedRoles,
      hasAllowedRole: user && allowedRoles.includes(user.role)
    });
    
    // Check if token exists
    const token = localStorage.getItem('token');
    console.log('Token exists:', Boolean(token));
  }, [user, isAuthenticated, loading, allowedRoles]);

  if (loading) {
    console.log('RoleProtectedRoute: Still loading...');
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('RoleProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user has an allowed role
  if (!allowedRoles.includes(user?.role)) {
    console.log('RoleProtectedRoute: User does not have required role:', { 
      userRole: user?.role, 
      allowedRoles 
    });
    return <Navigate to="/" replace />;
  }

  console.log('RoleProtectedRoute: Access granted to user:', { 
    name: user?.name, 
    role: user?.role 
  });
  return <Outlet />;
};

export default RoleProtectedRoute; 