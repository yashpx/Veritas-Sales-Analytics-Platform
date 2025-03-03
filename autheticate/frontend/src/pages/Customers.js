import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Avatar, Chip, 
  TextField, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const MOCK_CUSTOMERS = [
  { 
    id: 1, 
    name: "Alice Johnson", 
    email: "alice.johnson@example.com", 
    status: "active",
    totalSpent: 3250,
    lastPurchase: "2023-12-15"
  },
  { 
    id: 2, 
    name: "Bob Smith", 
    email: "bob.smith@example.com", 
    status: "inactive",
    totalSpent: 1120,
    lastPurchase: "2023-10-22"
  },
  { 
    id: 3, 
    name: "Carol Williams", 
    email: "carol.williams@example.com", 
    status: "active",
    totalSpent: 5600,
    lastPurchase: "2023-12-28"
  },
  { 
    id: 4, 
    name: "David Brown", 
    email: "david.brown@example.com", 
    status: "active",
    totalSpent: 2840,
    lastPurchase: "2023-11-30"
  },
  { 
    id: 5, 
    name: "Eve Davis", 
    email: "eve.davis@example.com", 
    status: "pending",
    totalSpent: 750,
    lastPurchase: "2023-12-05"
  },
  { 
    id: 6, 
    name: "Frank Wilson", 
    email: "frank.wilson@example.com", 
    status: "active",
    totalSpent: 4200,
    lastPurchase: "2023-12-22"
  },
  { 
    id: 7, 
    name: "Grace Moore", 
    email: "grace.moore@example.com", 
    status: "inactive",
    totalSpent: 920,
    lastPurchase: "2023-09-15"
  }
];

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, fetch customers from your API
    // For this demo, we'll use mock data
    const fetchCustomers = () => {
      setLoading(true);
      setTimeout(() => {
        setCustomers(MOCK_CUSTOMERS);
        setFilteredCustomers(MOCK_CUSTOMERS);
        setLoading(false);
      }, 600);
    };

    if (user) {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: 'var(--heading-color)' }}>
          Customers
        </Typography>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search customers..."
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
                <TableCell>Customer</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell>Last Purchase</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No customers found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'var(--primary-light)' }}>
                          {customer.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body1">{customer.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.status} 
                        color={getStatusColor(customer.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>${customer.totalSpent.toLocaleString()}</TableCell>
                    <TableCell>{formatDate(customer.lastPurchase)}</TableCell>
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

export default Customers;