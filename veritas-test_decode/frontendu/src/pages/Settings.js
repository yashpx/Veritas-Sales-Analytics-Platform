import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Switch, FormControlLabel, Divider,
  TextField, Button, Select, MenuItem, FormControl, InputLabel, 
  Alert, Snackbar, Tabs, Tab
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteIcon from '@mui/icons-material/Palette';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  
  // Display settings
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [theme, setTheme] = useState('light');
  const [compactMode, setCompactMode] = useState(false);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSaveSettings = () => {
    // In a real application, save settings to your API
    setSuccessMessage('Settings saved successfully');
    setShowSnackbar(true);
  };

  const handleChangePassword = () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setSuccessMessage('All password fields are required');
      setShowSnackbar(true);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setSuccessMessage('New passwords do not match');
      setShowSnackbar(true);
      return;
    }
    
    // In a real application, change password via your auth system
    setSuccessMessage('Password changed successfully');
    setShowSnackbar(true);
    
    // Clear form
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, color: 'var(--heading-color)' }}>
          Settings
        </Typography>

        <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { py: 2 } }}
            >
              <Tab icon={<SecurityIcon />} label="Security" />
              <Tab icon={<NotificationsIcon />} label="Notifications" />
              <Tab icon={<LanguageIcon />} label="Region & Language" />
              <Tab icon={<PaletteIcon />} label="Display" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Security Settings */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Security Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={twoFactorEnabled} 
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Enable Two-Factor Authentication"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Add an extra layer of security to your account with 2FA
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Session Timeout (minutes)</InputLabel>
                    <Select
                      value={sessionTimeout}
                      label="Session Timeout (minutes)"
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    >
                      <MenuItem value={15}>15 minutes</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                      <MenuItem value={120}>2 hours</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Change Password
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} />
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleChangePassword}
                    sx={{ mt: 1 }}
                  >
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* Notification Settings */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Notification Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={emailNotifications} 
                        onChange={(e) => setEmailNotifications(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Email Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Receive notifications via email
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={pushNotifications} 
                        onChange={(e) => setPushNotifications(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Push Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Receive notifications in your browser
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Report & Digest Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={dailyDigest} 
                        onChange={(e) => setDailyDigest(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Daily Activity Digest"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Receive a summary of daily activities
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={weeklyReport} 
                        onChange={(e) => setWeeklyReport(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Weekly Performance Report"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Receive a weekly performance report
                  </Typography>
                </Grid>
              </Grid>
            )}

            {/* Region & Language Settings */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Region & Language Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={language}
                      label="Language"
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                      <MenuItem value="zh">Chinese</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={timezone}
                      label="Timezone"
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="EST">Eastern Time (EST)</MenuItem>
                      <MenuItem value="CST">Central Time (CST)</MenuItem>
                      <MenuItem value="MST">Mountain Time (MST)</MenuItem>
                      <MenuItem value="PST">Pacific Time (PST)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Changing your language preference will take effect after you refresh the page.
                  </Alert>
                </Grid>
              </Grid>
            )}

            {/* Display Settings */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Display Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={theme}
                      label="Theme"
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="system">System Default</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={compactMode} 
                        onChange={(e) => setCompactMode(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Compact Mode"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Use compact spacing between elements
                  </Typography>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={successMessage.includes('error') || successMessage.includes('not match') ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default Settings;