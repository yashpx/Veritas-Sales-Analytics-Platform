import React from 'react';

const AuthLayout = ({ children, illustrationSrc, heading }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side for form */}
      <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
          {heading && <h2 style={{ marginBottom: '2rem' }}>{heading}</h2>}
          {children}
        </div>
      </div>

      {/* Right side for illustration */}
      <div
        style={{
          flex: '1',
          backgroundColor: '#f5f6fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {illustrationSrc ? (
          <img
            src={illustrationSrc}
            alt="Illustration"
            style={{ width: '70%', height: 'auto', maxWidth: '500px' }}
          />
        ) : (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: '#7e22ce',
            color: 'white',
            borderRadius: '10px',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Welcome to Supabase Auth Demo</h3>
            <p>A secure and modern authentication system</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;