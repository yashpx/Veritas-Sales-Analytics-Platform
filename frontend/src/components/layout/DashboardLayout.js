import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Avatar, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AnalyticsIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const [expanded, setExpanded] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleMouseEnter = () => {
    const timer = setTimeout(() => {
      setExpanded(true);
    }, 100);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    const timer = setTimeout(() => {
      setExpanded(false);
    }, 300);
    setHoverTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer) clearTimeout(hoverTimer);
    };
  }, [hoverTimer]);

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/dashboard/analytics' },
    { text: 'Contacts', icon: <PeopleIcon />, path: '/dashboard/customers' },
    { text: 'Sales Reps', icon: <PeopleIcon />, path: '/dashboard/sales-reps' },
    { text: 'Call Logs', icon: <PhoneIcon />, path: '/dashboard/calls' },
  ];

  const utilityItems = [
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/dashboard/notifications' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
  ];

  const listItemStyles = (isActive = false) => ({
    mb: 1,
    borderRadius: 1.5,
    backgroundColor: isActive ? '#f0f4ff' : 'transparent',
    pl: expanded ? 3 : 'inherit',
    justifyContent: expanded ? 'flex-start' : 'center',
    height: 44,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: isActive ? '#e6edff' : '#f5f5f5',
      transform: 'translateX(2px)',
    },
  });

  const listItemIconStyles = (isActive = false) => ({
    minWidth: expanded ? 36 : 0,
    color: isActive ? '#5b8af5' : '#707070',
    transition: 'color 0.2s ease',
    display: 'flex',
    justifyContent: 'center',
  });

  const listItemTextStyles = () => ({
    opacity: expanded ? 1 : 0,
    transition: 'opacity 0.3s ease',
    '& .MuiTypography-root': {
      fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
      fontWeight: 600,
      fontSize: '0.95rem',
      letterSpacing: '-0.01em',
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: expanded ? 240 : 72,
          height: '100vh',
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'fixed',
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
          zIndex: 1200,
          '&:hover': {
            boxShadow: '0 0 15px rgba(0,0,0,0.1)',
          },
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo/Brand Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            p: 2,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <img src="/assets/Logo.png" alt="Veritas" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>

          {expanded && (
            <Box
              sx={{
                ml: 2,
                fontWeight: 800,
                fontSize: '1.2rem',
                fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
                letterSpacing: '-0.01em',
                opacity: expanded ? 1 : 0,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Veritas
            </Box>
          )}
        </Box>

        {/* Main Navigation */}
        <List sx={{ width: '100%', px: 1, mt: 2 }}>
          {navigationItems.map((item) => (
            <Tooltip
              key={item.text}
              title={!expanded ? item.text : ""}
              placement="right"
              arrow
            >
              <ListItem
                button
                component={Link}
                to={item.path}
                sx={listItemStyles(location.pathname === item.path)}
              >
                <ListItemIcon sx={listItemIconStyles(location.pathname === item.path)}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={listItemTextStyles()} 
                />
              </ListItem>
            </Tooltip>
          ))}
        </List>

        {/* Bottom Section */}
        <Box sx={{ mt: 'auto', mb: 2, width: '100%' }}>
          <List sx={{ px: 1 }}>
            {utilityItems.map((item) => (
              <Tooltip
                key={item.text}
                title={!expanded ? item.text : ""}
                placement="right"
                arrow
              >
                <ListItem
                  button
                  component={Link}
                  to={item.path}
                  sx={listItemStyles(location.pathname === item.path)}
                >
                  <ListItemIcon sx={listItemIconStyles(location.pathname === item.path)}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={listItemTextStyles()}
                  />
                </ListItem>
              </Tooltip>
            ))}
            
            <Tooltip
              title={!expanded ? "Logout" : ""}
              placement="right"
              arrow
            >
              <ListItem
                button
                onClick={handleSignOut}
                sx={listItemStyles()}
              >
                <ListItemIcon sx={listItemIconStyles()}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  sx={listItemTextStyles()}
                />
              </ListItem>
            </Tooltip>
          </List>

          {/* User Profile */}
          <Box
            component={Link}
            to="/dashboard/profile"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: expanded ? 3 : 'auto',
              py: 2,
              borderTop: '1px solid #f0f0f0',
              mt: 2,
              justifyContent: expanded ? 'flex-start' : 'center',
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <Avatar
              alt={user?.email || "User"}
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'var(--primary-color)',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </Avatar>

            {expanded && user && (
              <Box
                sx={{
                  ml: 2,
                  opacity: expanded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 160,
                }}
              >
                <Box
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {user.email}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#5b8af5',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
                  }}
                >
                  <PersonIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                  View Profile
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          marginLeft: { xs: '72px', sm: '72px' },
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: 'var(--dark-bg)',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;