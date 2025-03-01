import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';

const DashboardLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <div 
          style={{ 
            width: '240px', 
            backgroundColor: '#fff', 
            borderRight: '1px solid #eee',
            padding: '1rem 0'
          }}
        >
          <div style={{ padding: '0.5rem 1rem', marginBottom: '2rem' }}>
            <h3 style={{ color: '#7e22ce' }}>Dashboard</h3>
          </div>
          <div>
            <Link 
              to="/dashboard" 
              style={{ 
                display: 'block', 
                padding: '0.75rem 1.5rem', 
                color: '#333',
                borderLeft: '3px solid #7e22ce'
              }}
            >
              Home
            </Link>
            <Link 
              to="/dashboard/profile" 
              style={{ 
                display: 'block', 
                padding: '0.75rem 1.5rem', 
                color: '#333'
              }}
            >
              Profile
            </Link>
            <Link 
              to="/dashboard/settings" 
              style={{ 
                display: 'block', 
                padding: '0.75rem 1.5rem', 
                color: '#333'
              }}
            >
              Settings
            </Link>
          </div>
        </div>
        <main style={{ flex: 1, padding: '2rem', backgroundColor: '#f5f6fa' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;