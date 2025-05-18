import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

/**
 * Route protection component that checks user roles
 * Redirects to login if not authenticated or to home if role not allowed
 * @param {string[]} allowedRoles - Array of roles that can access this route
 */
const RoleProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute; 