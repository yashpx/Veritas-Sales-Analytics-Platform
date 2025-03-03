// src/components/ProfileSettings.js
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const ProfileSettings = ({ user }) => {
  const [profileData, setProfileData] = useState(null);

  // Simulate fetching user data based on 'user' prop
  useEffect(() => {
    // Fetch user data (you can replace this with an API call or other logic)
    if (user === 'user1') {
      setProfileData({ name: 'John Doe', email: 'john.doe@example.com' });
    } else if (user === 'user2') {
      setProfileData({ name: 'Jane Smith', email: 'jane.smith@example.com' });
    }
  }, [user]);

  // Handle saving the profile
  const handleSave = () => {
    console.log('Profile saved!', profileData);
    // Perform save operation (e.g., send data to API)
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Profile Settings for {user}
      </Typography>
      {profileData ? (
        <>
          <TextField
            label="Name"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            fullWidth
            margin="normal"
          />
          <Button onClick={handleSave} variant="contained" color="primary" sx={{ mt: 2 }}>
            Save
          </Button>
        </>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </Box>
  );
};

export default ProfileSettings;
