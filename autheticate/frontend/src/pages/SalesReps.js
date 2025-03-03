import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Avatar, Chip, 
  TextField, InputAdornment, LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const MOCK_SALES_REPS = [
  { 
    id: 1, 
    name: "John Davis", 
    email: "john.davis@veritas.com", 
    role: "Senior Sales Rep",
    quota: 50000,
    achieved: 42500,
    performance: 85,
    status: "active"
  },
  { 
    id: 2, 
    name: "Sarah Miller", 
    email: "sarah.miller@veritas.com", 
    role: "Sales Manager",
    quota: 100000,
    achieved: 92000,
    performance: 92,
    status: "active"
  },
  { 
    id: 3, 
    name: "Michael Johnson", 
    email: "michael.johnson@veritas.com", 
    role: "Junior Sales Rep",
    quota: 30000,
    achieved: 18000,
    performance: 60,
    status: "training"
  },
  { 
    id: 4, 
    name: "Emily Wilson", 
    email: "emily.wilson@veritas.com", 
    role: "Senior Sales Rep",
    quota: 50000,
    achieved: 52000,
    performance: 104,
    status: "active"
  },
  { 
    id: 5, 
    name: "Robert Brown", 
    email: "robert.brown@veritas.com", 
    role: "Sales Rep",
    quota: 40000,
    achieved: 38000,
    performance: 95,
    status: "active"
  },
  { 
    id: 6, 
    name: "Lisa Martinez", 
    email: "lisa.martinez@veritas.com", 
    role: "Senior Sales Rep",
    quota: 50000,
    achieved: 22000,
    performance: 44,
    status: "probation"
  },
  { 
    id: 7, 
    name: "Daniel Taylor", 
    email: "daniel.taylor@veritas.com", 
    role: "Sales Rep",
    quota: 40000,
    achieved: 41200,
    performance: 103,
    status: "active"
  }
];

const SalesReps = () => {
  const { user } = useAuth();
  const [salesReps, setSalesReps] = useState([]);
  const [filteredReps, setFilteredReps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, fetch sales reps from your API
    // For this demo, we'll use mock data
    const fetchSalesReps = () => {
      setLoading(true);
      setTimeout(() => {
        setSalesReps(MOCK_SALES_REPS);
        setFilteredReps(MOCK_SALES_REPS);
        setLoading(false);
      }, 600);
    };

    if (user) {
      fetchSalesReps();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = salesReps.filter(rep => 
        rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReps(filtered);
    } else {
      setFilteredReps(salesReps);
    }
  }, [searchQuery, salesReps]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'training':
        return 'info';
      case 'probation':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return '#4caf50';
    if (performance >= 70) return '#ff9800';
    return '#f44336';
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: 'var(--heading-color)' }}>
          Sales Representatives
        </Typography>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search sales reps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: 500,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Representative</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Quota</TableCell>
                <TableCell>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    Loading sales representatives...
                  </TableCell>
                </TableRow>
              ) : filteredReps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No sales representatives found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredReps.map((rep) => (
                  <TableRow key={rep.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'var(--primary-light)' }}>
                          {rep.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">{rep.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{rep.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{rep.role}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rep.status} 
                        color={getStatusColor(rep.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>${rep.quota.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 150 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(rep.performance, 100)} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 5,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getPerformanceColor(rep.performance),
                              }
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${rep.performance}%`}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DashboardLayout>
  );
};

export default SalesReps;