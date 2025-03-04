import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, 
  TextField, InputAdornment, IconButton, CircularProgress, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

// Supabase connection
const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';
const supabase = createClient(supabaseUrl, supabaseKey);

const Calls = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch calls from Supabase
    const fetchCallLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get call logs data with joined customer and sales rep information
        const { data, error } = await supabase
          .from('call_logs')
          .select(`
            call_id,
            call_date,
            duration_minutes,
            call_outcome,
            notes,
            customers (
              customer_id,
              customer_first_name,
              customer_last_name
            ),
            sales_reps (
              sales_rep_id,
              sales_rep_first_name,
              sales_rep_last_name
            )
          `)
          .order('call_date', { ascending: false });
        
        if (error) throw error;
        
        // Transform data for display
        const formattedCalls = data.map(call => ({
          id: call.call_id,
          date: call.call_date,
          client: `${call.customers?.customer_first_name || 'Unknown'} ${call.customers?.customer_last_name || ''}`,
          customerId: call.customers?.customer_id,
          salesRep: `${call.sales_reps?.sales_rep_first_name || 'Unknown'} ${call.sales_reps?.sales_rep_last_name || ''}`,
          salesRepId: call.sales_reps?.sales_rep_id,
          duration: call.duration_minutes,
          outcome: call.call_outcome || 'Unknown',
          notes: call.notes
        }));
        
        setCalls(formattedCalls);
        setFilteredCalls(formattedCalls);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching calls:', err);
        setError('Failed to load call records. Please try again later.');
        setLoading(false);
      }
    };

    if (user) {
      fetchCallLogs();
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
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
            Call Logs
          </Typography>
          {/* Action buttons removed as per request */}
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflowX: 'hidden' }}>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell width="15%">Date</TableCell>
                <TableCell width="20%">Client</TableCell>
                <TableCell width="20%">Sales Rep</TableCell>
                <TableCell width="15%">Duration</TableCell>
                <TableCell width="15%">Outcome</TableCell>
                <TableCell width="15%" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} sx={{ color: 'var(--primary-color)', mr: 2 }} />
                    Loading call records...
                  </TableCell>
                </TableRow>
              ) : filteredCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    {searchQuery 
                      ? `No call records found matching "${searchQuery}"`
                      : 'No call records available'
                    }
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
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          aria-label="transcribe" 
                          title="View/Create Transcription"
                          component={Link}
                          to="/dashboard/call-transcription"
                          state={{ callData: call }}
                          sx={{ 
                            color: '#4A90E2',
                            '&:hover': { color: '#2A7DE1' } 
                          }}
                        >
                          <MicIcon fontSize="small" />
                        </IconButton>
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

export default Calls;