import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Avatar, Button, TextField, Grid, Divider, 
  Card, CardContent, Alert, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';

const Profile = () => {
  const { user, signOut, authType, getUserProfile } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: 'Sales',
    joinDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const userProfile = await getUserProfile();
        
        if (authType === 'supabase') {
          // For supabase users (managers)
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setProfile({
              firstName: data.name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || '',
              lastName: data.name?.split(' ').slice(1).join(' ') || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
              phone: data.phone_number || '',
              role: userProfile?.role || 'Manager',
              department: 'Sales',
              joinDate: user.created_at || data.created_at || new Date().toISOString()
            });
          } else {
            // If no profile data yet, use data from auth
            setProfile({
              firstName: user.user_metadata?.name?.split(' ')[0] || '',
              lastName: user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
              phone: user.phone || '',
              role: userProfile?.role || 'Manager',
              department: 'Sales',
              joinDate: user.created_at || new Date().toISOString()
            });
          }
        } else if (authType === 'sales_rep') {
          // For sales_rep users
          // Try to get sales rep details from the sales_reps table
          if (user.salesRepId) {
            const { data, error } = await supabase
              .from('sales_reps')
              .select('*')
              .eq('sales_rep_id', user.salesRepId)
              .single();
              
            if (!error && data) {
              setProfile({
                firstName: data.sales_rep_first_name || '',
                lastName: data.sales_rep_last_name || '',
                email: data.Email || user.email,
                phone: data['Phone Number'] ? String(data['Phone Number']) : '',
                role: 'Sales Representative',
                department: 'Sales',
                joinDate: user.created_at || new Date().toISOString()
              });
            } else {
              // Fallback to user data
              setProfile({
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                email: user.email,
                phone: user.phone || '',
                role: 'Sales Representative',
                department: 'Sales',
                joinDate: user.created_at || new Date().toISOString()
              });
            }
          } else {
            // Fallback to user data if salesRepId is not available
            setProfile({
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
              phone: user.phone || '',
              role: 'Sales Representative',
              department: 'Sales',
              joinDate: user.created_at || new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to basic user data
        setProfile({
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          phone: '',
          role: authType === 'sales_rep' ? 'Sales Representative' : 'Manager',
          department: 'Sales',
          joinDate: user.created_at || new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authType, getUserProfile]);

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

  const handleSaveProfile = async () => {
    setLoading(true);
    setSuccessMessage('');
    
    try {
      // For Supabase users
      if (authType === 'supabase') {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: `${profile.firstName} ${profile.lastName}`,
            phone_number: profile.phone,
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
      } 
      // For sales_rep users
      else if (authType === 'sales_rep' && user.salesRepId) {
        const { error } = await supabase
          .from('sales_reps')
          .update({
            sales_rep_first_name: profile.firstName,
            sales_rep_last_name: profile.lastName,
            'Phone Number': profile.phone ? parseInt(profile.phone, 10) : null
          })
          .eq('sales_rep_id', user.salesRepId);
          
        if (error) throw error;
      }
      
      setSuccessMessage('Profile updated successfully!');
      setEditMode(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSuccessMessage('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
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
          <Alert severity={successMessage.includes('Failed') ? 'error' : 'success'} sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {loading && !profile.email ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress size={60} thickness={4} sx={{ color: 'var(--primary-color)' }} />
          </Box>
        ) : (
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
                    {`${profile.firstName || ''} ${profile.lastName || ''}`}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {profile.role || (authType === 'sales_rep' ? 'Sales Representative' : 'Manager')}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ textAlign: 'left', mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-word' }}>
                      {profile.email || user?.email || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.phone || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Department
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.department || 'Sales'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Join Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(profile.joinDate) || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="medium"
                    onClick={signOut}
                    sx={{ 
                      mt: 2,
                      mx: 'auto',
                      display: 'block',
                      minWidth: '120px',
                      maxWidth: '160px',
                      width: '80%'
                    }}
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
                        size="medium"
                        sx={{
                          bgcolor: 'var(--primary-color)',
                          '&:hover': {
                            bgcolor: 'var(--primary-hover)',
                          },
                          minWidth: '120px',
                          maxWidth: '140px',
                          px: 2
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          editMode ? 'Save' : 'Edit'
                        )}
                      </Button>
                    </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="firstName"
                          value={profile.firstName || ''}
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
                          value={profile.lastName || ''}
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
                          value={profile.email || user?.email || ''}
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
                          value={profile.phone || ''}
                          onChange={handleInputChange}
                          disabled={!editMode || loading}
                          variant="outlined"
                          placeholder="Enter phone number"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          value={profile.department || 'Sales'}
                          onChange={handleInputChange}
                          disabled={true} // Department is fixed
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Role"
                          name="role"
                          value={profile.role || (authType === 'sales_rep' ? 'Sales Representative' : 'Manager')}
                          onChange={handleInputChange}
                          disabled={true} // Role is fixed
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
                      size="medium"
                      sx={{ 
                        mt: 'auto',
                        borderColor: 'var(--primary-color)',
                        color: 'var(--primary-color)',
                        '&:hover': {
                          borderColor: 'var(--primary-hover)',
                          backgroundColor: 'rgba(90, 44, 160, 0.04)'
                        },
                        minWidth: '120px',
                        maxWidth: '180px'
                      }}
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
                      size="medium"
                      sx={{ 
                        mt: 'auto',
                        borderColor: 'var(--primary-color)',
                        color: 'var(--primary-color)',
                        '&:hover': {
                          borderColor: 'var(--primary-hover)',
                          backgroundColor: 'rgba(90, 44, 160, 0.04)'
                        },
                        minWidth: '120px',
                        maxWidth: '180px'
                      }}
                    >
                      Notifications
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default Profile;