import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/dashboard/profile', label: 'Profile', icon: '👤' },
    { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <div 
          style={{ 
            width: '240px', 
            backgroundColor: 'var(--secondary-bg)', 
            borderRight: '1px solid #2d3748',
            padding: '1.5rem 0'
          }}
        >
          <div style={{ padding: '0.5rem 1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '600' }}>Dashboard</h3>
          </div>
          <div>
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1.5rem', 
                  color: currentPath === item.path ? 'white' : '#d1d5db',
                  backgroundColor: currentPath === item.path ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                  borderLeft: currentPath === item.path ? '3px solid var(--primary-color)' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--dark-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;