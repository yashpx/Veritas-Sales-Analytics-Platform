import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ requiredRoles = [] }) => {
  const { user, loading, authType, getUserProfile } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const profile = await getUserProfile();
        setUserProfile(profile);
      }
      setProfileLoading(false);
    };
    
    fetchUserProfile();
  }, [user, getUserProfile]);
  
  if (loading || profileLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If roles are specified and user doesn't have the required role
  if (requiredRoles.length > 0) {
    const userRole = userProfile?.role || (authType === 'sales_rep' ? 'sales_rep' : 'manager');
    
    if (!requiredRoles.includes(userRole)) {
      // Redirect to the appropriate dashboard based on role
      const dashboardPath = userRole === 'sales_rep' ? '/dashboard/sales-rep' : '/dashboard';
      return <Navigate to={dashboardPath} replace />;
    }
  }
  
  // Check if we need to redirect from a common dashboard path to a role-specific one
  if (location.pathname === '/dashboard' && authType === 'sales_rep') {
    console.log('Redirecting sales rep from common dashboard to sales rep dashboard');
    return <Navigate to="/dashboard/sales-rep" replace />;
  }
  
  // User is authenticated and has required role (if any)
  return <Outlet />;
};

// Helper components for specific roles
export const ManagerRoute = (props) => <PrivateRoute requiredRoles={['manager']} {...props} />;
export const SalesRepRoute = (props) => <PrivateRoute requiredRoles={['sales_rep']} {...props} />;
export const AnyAuthRoute = (props) => <PrivateRoute {...props} />;

export default PrivateRoute;