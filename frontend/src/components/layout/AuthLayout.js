import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, illustrationSrc, heading, video = false }) => {
  return (
    <div className="auth-layout">
      {/* Left side for form */}
      <div className="auth-layout-form">
        <div className="auth-layout-content">
          <div className="auth-layout-logo">
            <img src="/assets/logo_dark.png" alt="Logo" />
            <span>AuthSystem</span>
          </div>
          
          {heading && <h2 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>{heading}</h2>}
          {children}
        </div>
      </div>

      {/* Right side for visual */}
      <div className="auth-layout-visual">
        {video ? (
          <video 
            autoPlay 
            loop 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src={illustrationSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : illustrationSrc ? (
          <img
            src={illustrationSrc}
            alt="Illustration"
            style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
          />
        ) : (
          <div className="default-visual">
            <h2>Secure Authentication</h2>
            <p>Powered by Supabase</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;