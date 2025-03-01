import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
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
      <h1 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <Card>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#7e22ce', marginBottom: '0.5rem' }}>5</h3>
          <p style={{ color: '#6b7280' }}>Successful logins</p>
        </Card>
        
        <Card>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#7e22ce', marginBottom: '0.5rem' }}>2</h3>
          <p style={{ color: '#6b7280' }}>Active sessions</p>
        </Card>
        
        <Card>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#7e22ce', marginBottom: '0.5rem' }}>7</h3>
          <p style={{ color: '#6b7280' }}>Days since registration</p>
        </Card>
      </div>
      
      <Card>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>Your Profile</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Email</p>
              <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{userData?.email}</p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>User ID</p>
              <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{userData?.id}</p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Last Sign In</p>
              <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>
                {userData?.last_sign_in_at ? new Date(userData.last_sign_in_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Created At</p>
              <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>
                {userData?.created_at ? new Date(userData.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <button
              onClick={signOut}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default Dashboard;