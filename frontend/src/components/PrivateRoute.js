import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component for routes that require authentication
const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  return user ? <Outlet /> : <Navigate to="/login" />;
};

// Component for routes that require manager role
export const ManagerRoute = () => {
  const { user, userProfile, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated but not a manager, redirect to dashboard
  if (userProfile?.role !== 'manager') {
    return <Navigate to="/dashboard" />;
  }
  
  return <Outlet />;
};

// Component for routes that require sales rep role
export const SalesRepRoute = () => {
  const { user, userProfile, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated but not a sales rep, redirect to dashboard
  if (userProfile?.role !== 'sales_rep') {
    return <Navigate to="/dashboard" />;
  }
  
  return <Outlet />;
};

export default PrivateRoute;