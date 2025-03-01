import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '1rem', color: '#1f2937' }}>
              Welcome to <span style={{ color: '#7e22ce' }}>Supabase Auth Demo</span>
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#4b5563', maxWidth: '600px', margin: '0 auto' }}>
              A secure, modern authentication system powered by Supabase and React
            </p>
          </div>
          
          {user ? (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                You are currently signed in as <strong style={{ color: '#7e22ce' }}>{user.email}</strong>
              </p>
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#7e22ce',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>Get started by signing in or creating a new account</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link
                  to="/login"
                  style={{
                    backgroundColor: '#7e22ce',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#7e22ce',
                    border: '1px solid #7e22ce',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '3rem', borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>Features</h2>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>User registration with email and password</li>
              <li style={{ marginBottom: '0.5rem' }}>User authentication and session management</li>
              <li style={{ marginBottom: '0.5rem' }}>Protected routes for authenticated users</li>
              <li style={{ marginBottom: '0.5rem' }}>User profile and information display</li>
              <li style={{ marginBottom: '0.5rem' }}>Responsive design that works on all devices</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;