import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  return (
    <AuthLayout heading="Create your account">
      <RegisterForm />
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7e22ce', fontWeight: 'medium' }}>
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;