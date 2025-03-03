import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  return (
    <AuthLayout 
      heading="Create your account" 
      illustrationSrc="/assets/Welcome.mp4"
      video={true}
    >
      <RegisterForm />
      <div className="auth-switch">
        <p>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;