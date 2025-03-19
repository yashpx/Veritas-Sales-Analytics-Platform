import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (showOrgSelector && !selectedOrganization) {
      setError('Please select an organization');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // If we're in organization selection mode
      if (showOrgSelector) {
        // Call API to set the user's current organization
        const { data: session } = await supabase.auth.getSession();
        if (session) {
          // Update the user's current organization
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ current_organization: selectedOrganization })
            .eq('user_id', session.user.id);
            
          if (updateError) throw updateError;
        }
        
        navigate('/dashboard');
        return;
      }
      
      // Normal login flow
      const { error } = await signIn(email, password);
      
      if (error) throw error;
      
      // Check if user belongs to multiple organizations
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userProfiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id);
          
        if (profileError) throw profileError;
        
        // If user has multiple profiles, show org selector
        if (userProfiles && userProfiles.length > 1) {
          setOrganizationOptions(userProfiles);
          setShowOrgSelector(true);
          return;
        }
      }
      
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Failed to sign in');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      {showOrgSelector ? (
        <>
          <h3>Select Organization</h3>
          <p>You belong to multiple organizations. Please select which one you'd like to access:</p>
          
          <div className="form-field">
            <label>Organization</label>
            <select 
              value={selectedOrganization} 
              onChange={(e) => setSelectedOrganization(e.target.value)} 
              className="form-select"
              required
            >
              <option value="">-- Select an organization --</option>
              {organizationOptions.map(profile => (
                <option key={profile.organization_id} value={profile.organization_id}>
                  {profile.organization_name || profile.organization_id}
                </option>
              ))}
            </select>
          </div>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Continuing...' : 'Continue'}
          </Button>
        </>
      ) : (
        <>
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
          </div>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </>
      )}
    </form>
  );
};

export default LoginForm;