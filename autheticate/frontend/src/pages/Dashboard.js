import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      // Just use the user object from auth
      setUserData(user);
      setLoading(false);
    }
  }, [user]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '1.5rem' }}>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>5</h3>
          <p>Successful logins</p>
        </Card>
        
        <Card>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>2</h3>
          <p>Active sessions</p>
        </Card>
        
        <Card>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>7</h3>
          <p>Days since registration</p>
        </Card>
      </div>
      
      <Card>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Your Profile</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Email</p>
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>{userData?.email}</p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>User ID</p>
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>{userData?.id}</p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Last Sign In</p>
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>
                {userData?.last_sign_in_at ? new Date(userData.last_sign_in_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Created At</p>
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>
                {userData?.created_at ? new Date(userData.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <Button 
              variant="danger" 
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default Dashboard;