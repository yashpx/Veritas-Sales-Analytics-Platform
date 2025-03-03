import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';  // Import useLocation
import { Box, List, ListItem, ListItemIcon, ListItemText, Avatar, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AnalyticsIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import logo from './veritaslogo.jpg';

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);

  const location = useLocation();

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
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Sales Reps', icon: <PeopleIcon />, path: '/sales-reps' },
    { text: 'Calls', icon: <PhoneIcon />, path: '/calls' },
  ];

  const utilityItems = [
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const listItemStyles = (isActive = false, isPressed = false) => ({
    mb: 1,
    borderRadius: 1.5,
    backgroundColor: isActive || isPressed ? '#f0f4ff' : 'transparent',
    pl: expanded ? 3 : 'inherit',
    justifyContent: expanded ? 'flex-start' : 'center',
    height: 44,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: isActive || isPressed ? '#e6edff' : '#f5f5f5',
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
      fontWeight: 800,
      fontSize: '0.95rem',
      letterSpacing: '-0.01em',
    },
  });

  return (
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
        position: 'relative',
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
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
            backgroundColor: '#6200EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          <img
            src={logo} 
            alt="Veritas Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
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
                sx={listItemStyles()}
              >
                <ListItemIcon sx={listItemIconStyles()}>
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

        {/* User Profile */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: expanded ? 3 : 'auto',
            py: 2,
            borderTop: '1px solid #f0f0f0',
            mt: 2,
            justifyContent: expanded ? 'flex-start' : 'center',
          }}
        >
          <Avatar
            alt="User Profile"
            src="/static/images/avatar/1.jpg"
            sx={{
              width: 36,
              height: 36,
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />

          {expanded && (
            <Box
              sx={{
                ml: 2,
                opacity: expanded ? 1 : 0,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Box
                sx={{
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
                  letterSpacing: '-0.01em',
                }}
              >
                Easin Arafat
              </Box>
              <Box
                sx={{
                  color: '#757575',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
                }}
              >
                Manager
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
