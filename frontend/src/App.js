import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';
import './styles/global.css';

// Import the Analytics component from the kpi-dashboard
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Customers = React.lazy(() => import('./pages/Customers'));
const SalesReps = React.lazy(() => import('./pages/SalesReps'));
const Calls = React.lazy(() => import('./pages/Calls'));
const CallTranscription = React.lazy(() => import('./pages/CallTranscription'));
const DialPad = React.lazy(() => import('./pages/DialPad'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const SalesRepDashboard = React.lazy(() => import('./pages/SalesRepDashboard'));
const SalesRepAnalytics = React.lazy(() => import('./pages/SalesRepAnalytics'));

// Component to route users to the appropriate dashboard based on their role
const DashboardRouter = () => {
  const { user, getUserProfile, authType } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const routeToCorrectDashboard = async () => {
      if (!user) return;
      
      try {
        // Check if the user is a sales rep
        if (authType === 'sales_rep') {
          navigate('/dashboard/sales-rep', { replace: true });
        } else {
          // Default to manager dashboard for supabase users
          // Can be enhanced with additional role checking if needed
          const profile = await getUserProfile();
          const userRole = profile?.role || 'manager';
          
          if (userRole === 'sales_rep') {
            navigate('/dashboard/sales-rep', { replace: true });
          } else {
            // Render the default Dashboard for managers
            // No need to navigate since we're already at /dashboard
          }
        }
      } catch (error) {
        console.error('Error routing to dashboard:', error);
      }
    };
    
    routeToCorrectDashboard();
  }, [user, authType, getUserProfile, navigate]);
  
  // While routing logic runs, show loading or render the appropriate dashboard
  // This component actually serves as a router/redirect, so we'll render
  // the standard Dashboard by default, and the routing logic will redirect if needed
  return <Dashboard />;
};

const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    color: 'var(--text-color)'
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            {/* Dashboard routes based on user role */}
            <Route path="/dashboard" element={
              <DashboardRouter />
            } />
            
            {/* Manager dashboard routes */}
            <Route 
              path="/dashboard/analytics" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Analytics />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/customers" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Customers />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/sales-reps" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <SalesReps />
                </React.Suspense>
              } 
            />
            
            {/* Sales Rep specific routes */}
            <Route 
              path="/dashboard/sales-rep" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <SalesRepDashboard />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/sales-rep-analytics" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <SalesRepAnalytics />
                </React.Suspense>
              } 
            />
            
            {/* Common routes for both user types */}
            <Route 
              path="/dashboard/calls" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Calls />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/call-transcription" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <CallTranscription />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/dialpad" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <DialPad />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/notifications" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Notifications />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/settings" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Settings />
                </React.Suspense>
              } 
            />
            <Route 
              path="/dashboard/profile" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Profile />
                </React.Suspense>
              } 
            />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;