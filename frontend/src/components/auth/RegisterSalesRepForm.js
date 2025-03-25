import React, { useState } from 'react';
import axios from 'axios';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Lock, UserPlus } from 'lucide-react';

// Updated to use port 5000 where your backend is running
const API_URL = 'http://localhost:5000/api';

const RegisterSalesRepForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    sales_rep_first_name: '',
    sales_rep_last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { session } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.sales_rep_first_name || !formData.sales_rep_last_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Convert phone_number to number if provided
      const phoneNumber = formData.phone_number ? parseInt(formData.phone_number, 10) : null;
      
      // Prepare payload
      const payload = {
        sales_rep_first_name: formData.sales_rep_first_name,
        sales_rep_last_name: formData.sales_rep_last_name,
        email: formData.email,
        phone_number: phoneNumber,
        password: formData.password
      };
      
      // Make API call to create sales rep
      const response = await axios.post(
        `${API_URL}/auth/sales-rep/register`, 
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );
      
      setSuccess(true);
      setFormData({
        sales_rep_first_name: '',
        sales_rep_last_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: ''
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error registering sales rep:', error);
      setError(error.response?.data?.detail || 'Failed to register sales rep');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sales-rep-form-container compact">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Sales rep registered successfully!</div>}
      
      <form onSubmit={handleSubmit} className="register-sales-rep-form">
        <div className="form-row">
          <div className="form-column">
            <Input
              label="First Name"
              name="sales_rep_first_name"
              type="text"
              placeholder="John"
              value={formData.sales_rep_first_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-column">
            <Input
              label="Last Name"
              name="sales_rep_last_name"
              type="text"
              placeholder="Doe"
              value={formData.sales_rep_last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-column">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-column">
            <Input
              label="Phone Number (optional)"
              name="phone_number"
              type="tel"
              placeholder="1234567890"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-column">
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-column">
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-actions">
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? 'Registering...' : 'Register Sales Rep'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterSalesRepForm;