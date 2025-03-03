import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="welcome-container">
      {/* Left side content (30% width) */}
      <div className="welcome-content">
        <div className="welcome-logo">
          <img src="/assets/logo_dark.png" alt="Veritas Logo" />
          <span>veritas</span>
        </div>
        
        <h1>Transform the Way You Capture Every Conversation</h1>
        
        <p>
          Veritas ensures your vital moments are secure, searchable, and always at your fingertips.
        </p>
        
        {user ? (
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button>Get Started</Button>
          </Link>
        )}
      </div>
      
      {/* Right side video (70% width) */}
      <div className="welcome-video">
        <video autoPlay loop muted>
          <source src="/assets/Welcome.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default Home;