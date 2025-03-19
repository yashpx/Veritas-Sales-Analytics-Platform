import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  return (
    <AuthLayout 
      heading="Welcome back"
      illustrationSrc="/assets/illustration.png"
    >
      <LoginForm />
      <div className="auth-switch">
        <p>
          Don't have an account?{' '}
          <Link to="/register">Create account</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;