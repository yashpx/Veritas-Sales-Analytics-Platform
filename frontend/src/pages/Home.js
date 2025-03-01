import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="home-content">
        <h1>Welcome to Supabase Auth Demo</h1>
        <p>
          This application demonstrates authentication using Supabase and React.
        </p>
        
        {user ? (
          <div className="authenticated">
            <p>You are currently logged in as {user.email}</p>
            <Link to="/dashboard" className="dashboard-btn">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="unauthenticated">
            <p>Get started by logging in or creating a new account:</p>
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                Login
              </Link>
              <Link to="/register" className="register-btn">
                Register
              </Link>
            </div>
          </div>
        )}
        
        <div className="about-section">
          <h2>About This Demo</h2>
          <p>
            This application is built with React for the frontend and uses Supabase for authentication.
            It demonstrates:
          </p>
          <ul>
            <li>User registration with email and password</li>
            <li>User login and session management</li>
            <li>Protected routes that require authentication</li>
            <li>User profile and information display</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;