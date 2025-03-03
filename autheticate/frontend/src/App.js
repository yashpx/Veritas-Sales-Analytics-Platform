import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
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
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));

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
            <Route path="/dashboard" element={<Dashboard />} />
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
            <Route 
              path="/dashboard/calls" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Calls />
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