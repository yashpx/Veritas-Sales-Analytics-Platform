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
          <img src="/assets/logo_dark.png" alt="AuthSystem Logo" />
          <span>Veritas</span>
        </div>
        
        <h1>Transform the way you capture every conversation</h1>
        
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
      
      {/* CSS Styles */}
      <style jsx="true">{`
        .welcome-container {
          display: flex;
          min-height: 100vh;
          overflow: hidden;
        }
        
        .welcome-content {
          flex: 0 0 30%;
          background-color: var(--dark-bg);
          color: var(--light-text);
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .welcome-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 3rem;
        }
        
        .welcome-logo img {
          height: 32px;
          width: auto;
        }
        
        .welcome-logo span {
          font-weight: 600;
          font-size: 1.5rem;
        }
        
        .welcome-content h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }
        
        .welcome-content p {
          margin-bottom: 2.5rem;
          font-size: 1.125rem;
          color: #d1d5db;
          line-height: 1.6;
        }
        
        .welcome-video {
          flex: 0 0 70%;
          overflow: hidden;
        }
        
        .welcome-video video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        @media (max-width: 768px) {
          .welcome-container {
            flex-direction: column;
          }
          
          .welcome-content {
            flex: 0 0 100%;
            padding: 2rem;
          }
          
          .welcome-video {
            flex: 0 0 100%;
            height: 50vh;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;