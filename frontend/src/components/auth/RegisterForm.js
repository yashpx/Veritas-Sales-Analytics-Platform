import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('manager'); // Default to manager
  const [organizationId, setOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signUpManager, signUpSalesRep } = useAuth();
  
  // Fetch available organizations for sales rep registration
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (role === 'sales_rep') {
        try {
          const { data, error } = await supabase
            .from('organizations')
            .select('organization_id, name')
            .order('name', { ascending: true });
            
          if (error) throw error;
          setOrganizations(data || []);
        } catch (error) {
          console.error('Error fetching organizations:', error);
          setError('Failed to load organizations');
        }
      }
    };
    
    fetchOrganizations();
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (!firstName || !lastName) {
      setError('Please provide your name');
      return;
    }
    
    if (role === 'manager' && !orgName) {
      setError('Please provide an organization name');
      return;
    }
    
    if (role === 'sales_rep' && !organizationId) {
      setError('Please select an organization');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Direct API call instead of using context functions
      const apiUrl = '/api/auth/register';
      const requestData = {
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
        ...(role === 'manager' ? { organization_name: orgName } : { organization_id: organizationId })
      };
      
      console.log("Registering with data:", requestData);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      // Registration successful, show message
      setMessage(`Registration successful! Welcome to ${role === 'manager' ? 'your new organization' : 'the team'}.`);
      
      // Sign in after successful registration
      if (email && password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error("Auto sign-in failed:", error);
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } else {
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      setError(error.message || 'Failed to create an account');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      
      <div className="form-row">
        <Input
          label="First Name"
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        
        <Input
          label="Last Name"
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
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
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      
      <div className="form-row">
        <div className="form-field">
          <label>Role</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            className="form-select"
          >
            <option value="manager">Manager</option>
            <option value="sales_rep">Sales Representative</option>
          </select>
        </div>
      </div>
      
      {role === 'manager' ? (
        <Input
          label="Organization Name"
          type="text"
          placeholder="Your organization name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          required
        />
      ) : (
        <div className="form-field">
          <label>Select Organization</label>
          <select 
            value={organizationId} 
            onChange={(e) => setOrganizationId(e.target.value)} 
            className="form-select"
            required
          >
            <option value="">-- Select an organization --</option>
            {organizations.map(org => (
              <option key={org.organization_id} value={org.organization_id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="checkbox-container">
        <input type="checkbox" id="terms" required />
        <label htmlFor="terms">
          I agree to the <a href="/terms" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Terms of Service</a> and <a href="/privacy" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Privacy Policy</a>
        </label>
      </div>
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
};

export default RegisterForm;