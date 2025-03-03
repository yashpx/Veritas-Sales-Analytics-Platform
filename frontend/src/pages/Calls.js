import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, 
  TextField, InputAdornment, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const MOCK_CALLS = [
  { 
    id: 1, 
    date: "2023-12-28", 
    client: "Acme Corporation", 
    salesRep: "John Davis",
    duration: 32,
    outcome: "Closed",
    notes: "Client agreed to purchase 50 units. Follow-up with contract next week."
  },
  { 
    id: 2, 
    date: "2023-12-27", 
    client: "Global Industries", 
    salesRep: "Sarah Miller",
    duration: 45,
    outcome: "In-progress",
    notes: "Discussed pricing options. Client interested but needs time to consider."
  },
  { 
    id: 3, 
    date: "2023-12-26", 
    client: "Tech Solutions", 
    salesRep: "Michael Johnson",
    duration: 15,
    outcome: "Failed",
    notes: "Client not interested in our product. Found competitor with lower pricing."
  },
  { 
    id: 4, 
    date: "2023-12-24", 
    client: "Innovative Startups", 
    salesRep: "Emily Wilson",
    duration: 28,
    outcome: "Closed",
    notes: "Demo went well. Client purchased premium package for 12 months."
  },
  { 
    id: 5, 
    date: "2023-12-23", 
    client: "Global Enterprises", 
    salesRep: "Robert Brown",
    duration: 18,
    outcome: "In-progress",
    notes: "Client liked product demo. Requested formal quote and ROI analysis."
  },
  { 
    id: 6, 
    date: "2023-12-22", 
    client: "Modern Solutions", 
    salesRep: "Lisa Martinez",
    duration: 22,
    outcome: "Closed",
    notes: "Closed deal with 20% discount for first year. Client signed 2-year contract."
  },
  { 
    id: 7, 
    date: "2023-12-21", 
    client: "Best Systems", 
    salesRep: "Daniel Taylor",
    duration: 12,
    outcome: "Failed",
    notes: "Client budget constraints. Will follow up next quarter."
  }
];

const Calls = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, fetch calls from your API
    // For this demo, we'll use mock data
    const fetchCalls = () => {
      setLoading(true);
      setTimeout(() => {
        setCalls(MOCK_CALLS);
        setFilteredCalls(MOCK_CALLS);
        setLoading(false);
      }, 600);
    };

    if (user) {
      fetchCalls();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = calls.filter(call => 
        call.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.salesRep.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.outcome.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCalls(filtered);
    } else {
      setFilteredCalls(calls);
    }
  }, [searchQuery, calls]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
            Call Records
          </Typography>
          <IconButton 
            aria-label="download" 
            sx={{ 
              color: 'var(--primary-color)',
              bgcolor: 'var(--primary-light)', 
              '&:hover': { bgcolor: 'var(--primary-hover)' } 
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search calls..."
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
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Sales Rep</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Outcome</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Loading call records...
                  </TableCell>
                </TableRow>
              ) : filteredCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No call records found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalls.map((call) => (
                  <TableRow key={call.id} hover>
                    <TableCell>{formatDate(call.date)}</TableCell>
                    <TableCell>{call.client}</TableCell>
                    <TableCell>{call.salesRep}</TableCell>
                    <TableCell>{call.duration}m</TableCell>
                    <TableCell>
                      <span className={`status-badge ${call.outcome.toLowerCase()}`}>
                        {call.outcome}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        aria-label="view" 
                        title="View details"
                        sx={{ color: 'var(--primary-color)' }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
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

export default Calls;