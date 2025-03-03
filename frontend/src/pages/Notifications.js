import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Divider, IconButton, Tab, Tabs, Badge, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'info',
    title: 'New feature available',
    message: 'Call recording and analysis is now available for all sales reps.',
    date: '2023-12-28T10:23:00',
    read: false
  },
  {
    id: 2,
    type: 'success',
    title: 'Sales target achieved',
    message: 'Your team has reached 90% of the quarterly sales target!',
    date: '2023-12-27T15:45:00',
    read: false
  },
  {
    id: 3,
    type: 'warning',
    title: 'Meeting reminder',
    message: 'Strategy meeting with the global sales team tomorrow at 10:00 AM.',
    date: '2023-12-26T09:15:00',
    read: true
  },
  {
    id: 4,
    type: 'info',
    title: 'New team member',
    message: 'Sarah Johnson has joined the sales team. Please welcome her!',
    date: '2023-12-25T14:30:00',
    read: true
  },
  {
    id: 5,
    type: 'success',
    title: 'Client feedback',
    message: 'Acme Corp has left a 5-star review for our product and service.',
    date: '2023-12-24T11:20:00',
    read: true
  },
  {
    id: 6,
    type: 'warning',
    title: 'System maintenance',
    message: 'The CRM system will be unavailable on Saturday from 2 AM to 4 AM.',
    date: '2023-12-23T16:50:00',
    read: true
  }
];

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, fetch notifications from your API
    // For this demo, we'll use mock data
    const fetchNotifications = () => {
      setLoading(true);
      setTimeout(() => {
        setNotifications(MOCK_NOTIFICATIONS);
        setLoading(false);
      }, 600);
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return diffInDays + ' days ago';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getIconByType = (type) => {
    switch (type) {
      case 'info':
        return <InfoIcon sx={{ color: '#2196F3' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#FF9800' }} />;
      case 'success':
        return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
      default:
        return <InfoIcon sx={{ color: '#2196F3' }} />;
    }
  };

  const filteredNotifications = tab === 0 
    ? notifications 
    : tab === 1 
      ? notifications.filter(notification => !notification.read) 
      : notifications.filter(notification => notification.read);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
            Notifications
          </Typography>
          
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            disabled={!unreadCount}
          >
            Mark All as Read
          </Button>
        </Box>

        <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ '& .MuiTab-root': { py: 2 } }}
            >
              <Tab 
                label="All" 
                icon={
                  <Badge 
                    badgeContent={notifications.length} 
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { right: -15 } }}
                  />
                } 
                iconPosition="end"
              />
              <Tab 
                label="Unread" 
                icon={
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error"
                    sx={{ '& .MuiBadge-badge': { right: -15 } }}
                  />
                } 
                iconPosition="end"
              />
              <Tab label="Read" />
            </Tabs>
          </Box>

          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1">Loading notifications...</Typography>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1">No notifications</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    sx={{ 
                      py: 2,
                      px: 3,
                      bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                      transition: 'background-color 0.3s',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteNotification(notification.id)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.paper' }}>
                        {getIconByType(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: notification.read ? 'normal' : 'bold',
                              color: 'var(--heading-color)'
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(notification.date)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          color="text.primary"
                          sx={{ mt: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {!notification.read && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2, pb: 1 }}>
                      <Button 
                        size="small" 
                        onClick={() => handleMarkAsRead(notification.id)}
                        sx={{ textTransform: 'none' }}
                      >
                        Mark as read
                      </Button>
                    </Box>
                  )}
                  {index < filteredNotifications.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default Notifications;