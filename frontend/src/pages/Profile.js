import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Avatar, Button, TextField, Grid, Divider, 
  Card, CardContent, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    joinDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // In a real application, fetch profile from your API
    // For this demo, we'll use mock data based on the user
    const fetchProfile = () => {
      setLoading(true);
      setTimeout(() => {
        if (user) {
          setProfile({
            firstName: 'Alex',
            lastName: 'Morgan',
            email: user.email,
            phone: '(555) 123-4567',
            role: 'Sales Manager',
            department: 'Sales',
            joinDate: '2022-01-15'
          });
        }
        setLoading(false);
      }, 600);
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // In a real app, save profile to your API
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEditMode(false);
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }, 800);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, color: 'var(--heading-color)' }}>
          Profile
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: 'var(--primary-color)',
                    fontSize: '3rem'
                  }}
                >
                  {profile.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {`${profile.firstName} ${profile.lastName}`}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {profile.role}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left', mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profile.email}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Phone
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profile.phone}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Department
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profile.department}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Join Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(profile.joinDate)}
                  </Typography>
                </Box>
                
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth 
                  onClick={signOut}
                  sx={{ mt: 2 }}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EditIcon sx={{ color: 'var(--primary-color)', mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        Personal Information
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                      disabled={loading}
                    >
                      {editMode ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleInputChange}
                        disabled={!editMode || loading}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleInputChange}
                        disabled={!editMode || loading}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        disabled={true} // Email can't be changed
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        disabled={!editMode || loading}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        name="department"
                        value={profile.department}
                        onChange={handleInputChange}
                        disabled={!editMode || loading}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        name="role"
                        value={profile.role}
                        onChange={handleInputChange}
                        disabled={!editMode || loading}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LockIcon sx={{ color: 'var(--primary-color)', mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Security
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage your password and security settings
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    color="primary"
                    sx={{ mt: 'auto' }}
                  >
                    Change Password
                  </Button>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <NotificationsIcon sx={{ color: 'var(--primary-color)', mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Notifications
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure how you receive notifications and alerts
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    color="primary"
                    sx={{ mt: 'auto' }}
                  >
                    Notification Settings
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default Profile;