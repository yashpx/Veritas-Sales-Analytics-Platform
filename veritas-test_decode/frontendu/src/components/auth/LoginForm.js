import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('manager'); // 'manager' or 'sales_rep'
  const navigate = useNavigate();
  const { signIn, signInSalesRep } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      if (loginType === 'manager') {
        // Manager login uses Supabase auth
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Manager will be routed to the appropriate dashboard by the DashboardRouter
        navigate('/dashboard');
      } else {
        // Sales rep login uses custom auth
        const { error } = await signInSalesRep(email, password);
        if (error) throw error;
        // Redirect directly to the sales rep dashboard
        navigate('/dashboard/sales-rep');
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginType = () => {
    setLoginType(loginType === 'manager' ? 'sales_rep' : 'manager');
    setError(''); // Clear any previous errors
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="login-mode-toggle" style={{ marginBottom: '1rem' }}>
        <div className="login-toggle-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            type="button" 
            className={`toggle-button ${loginType === 'manager' ? 'active' : ''}`}
            onClick={() => setLoginType('manager')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loginType === 'manager' ? 'var(--primary-color)' : 'transparent',
              color: loginType === 'manager' ? 'white' : 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Manager Login
          </button>
          <button 
            type="button" 
            className={`toggle-button ${loginType === 'sales_rep' ? 'active' : ''}`}
            onClick={() => setLoginType('sales_rep')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loginType === 'sales_rep' ? 'var(--primary-color)' : 'transparent',
              color: loginType === 'sales_rep' ? 'white' : 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sales Rep Login
          </button>
        </div>
      </div>
      
      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <div className="checkbox-container">
        <input type="checkbox" id="remember-me" />
        <label htmlFor="remember-me">Remember me</label>
        
        {loginType === 'manager' && (
          <Link 
            to="/reset-password" 
            style={{ 
              marginLeft: 'auto', 
              color: 'var(--primary-color)', 
              fontSize: '0.875rem', 
              textDecoration: 'none' 
            }}
          >
            Forgot password?
          </Link>
        )}
      </div>
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : `Sign in as ${loginType === 'manager' ? 'Manager' : 'Sales Rep'}`}
      </Button>
    </form>
  );
};

export default LoginForm;