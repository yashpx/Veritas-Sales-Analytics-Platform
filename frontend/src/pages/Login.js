import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  return (
    <AuthLayout heading="Sign in to your account">
      <LoginForm />
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#7e22ce', fontWeight: 'medium' }}>
            Create one here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;