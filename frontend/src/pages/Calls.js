import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, 
  TextField, InputAdornment, IconButton, CircularProgress, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchCallLogs } from '../utils/callsService';
import '../styles/dashboard.css';

const Calls = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try direct Supabase query as a fallback if the service approach fails
    const loadCallLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Attempting to fetch call logs via callsService...');
        
        try {
          // First try using the service
          const data = await fetchCallLogs();
          
          console.log('Call logs fetched via service:', data);
          
          if (data && data.length > 0) {
            // Format the data
            const formattedCalls = data.map(call => ({
              ...call,
              // Make sure hasTranscription is set correctly, checking localStorage as backup
              hasTranscription: 
                call.hasTranscription || 
                localStorage.getItem(`transcription_flag_${call.id}`) === 'true' ||
                false
            }));
            
            setCalls(formattedCalls);
            setFilteredCalls(formattedCalls);
            setLoading(false);
            return;
          }
        } catch (serviceError) {
          console.error('Error with callsService, trying direct query:', serviceError);
        }
        
        // If we reach here, the service failed or returned no data
        // Try direct query to Supabase as fallback
        console.log('Falling back to direct Supabase query...');
        
        // Use temporary direct import of supabase client
        const supabase = (await import('../utils/supabaseClient')).default;
        
        // Using the same table joins as in your SQL query
        let { data: call_logs, error } = await supabase
          .from('call_logs')
          .select(`
            call_id,
            call_date,
            duration_minutes,
            call_outcome,
            notes,
            transcription,
            customers!inner(customer_id, customer_first_name, customer_last_name),
            sales_reps!inner(sales_rep_id, sales_rep_first_name, sales_rep_last_name)
          `);
        
        if (error) {
          throw new Error(`Supabase query error: ${error.message}`);
        }
        
        if (!call_logs || call_logs.length === 0) {
          console.warn('No call logs found in database');
          setCalls([]);
          setFilteredCalls([]);
          setLoading(false);
          setError('No call logs available in the database.');
          return;
        }
        
        console.log('Raw call logs data from direct query:', call_logs);
        
        // Format the data using the joined customer and sales rep data
        const formattedCalls = call_logs.map(call => ({
          id: call.call_id,
          date: call.call_date,
          salesRep: `${call.sales_reps?.sales_rep_first_name || ''} ${call.sales_reps?.sales_rep_last_name || ''}`.trim() || 'Unknown',
          client: `${call.customers?.customer_first_name || ''} ${call.customers?.customer_last_name || ''}`.trim() || 'Unknown',
          duration: call.duration_minutes,
          outcome: call.call_outcome || 'Unknown',
          notes: call.notes,
          hasTranscription: !!call.transcription,
          salesRepId: call.sales_reps?.sales_rep_id,
          customerId: call.customers?.customer_id
        }));
        
        setCalls(formattedCalls);
        setFilteredCalls(formattedCalls);
        setLoading(false);
      } catch (err) {
        console.error('All attempts to fetch call logs failed:', err);
        setError(`Failed to load call records: ${err.message}`);
        setLoading(false);
      }
    };

    if (user) {
      loadCallLogs();
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
                          title={call.hasTranscription ? "View Transcription" : "Create New Transcription"}
                          component={Link}
                          to="/dashboard/call-transcription"
                          state={{ callData: call }}
                          sx={{ 
                            color: call.hasTranscription ? '#4CAF50' : '#9E9E9E',
                            bgcolor: call.hasTranscription ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                            '&:hover': { 
                              color: call.hasTranscription ? '#2E7D32' : '#4A90E2',
                              bgcolor: call.hasTranscription ? 'rgba(76, 175, 80, 0.2)' : 'rgba(74, 144, 226, 0.1)'
                            },
                            borderRadius: '50%',
                            padding: 1
                          }}
                        >
                          {call.hasTranscription ? (
                            <HeadphonesIcon fontSize="small" />
                          ) : (
                            <MicOffIcon fontSize="small" />
                          )}
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