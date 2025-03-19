import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, 
  TextField, InputAdornment, IconButton, CircularProgress, Alert,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchCallLogs } from '../utils/callsService';
import '../styles/dashboard.css';

const Calls = () => {
  const { user, authType } = useAuth();
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Log user info for debugging
  useEffect(() => {
    console.log('Current user in Calls component:', { 
      user, 
      authType, 
      salesRepId: user?.salesRepId,
      isFilteringEnabled: authType === 'sales_rep' && user?.salesRepId
    });
  }, [user, authType]);

  useEffect(() => {
    // Try direct Supabase query as a fallback if the service approach fails
    const loadCallLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Attempt to find sales rep ID if it's missing but we know user is a sales rep
        let currentUser = user;
        if (authType === 'sales_rep' && user && !user.salesRepId && user.email) {
          console.log('Sales rep ID missing, attempting to fetch from sales_reps table');
          
          try {
            // Use temporary direct import of supabase client
            const supabase = (await import('../utils/supabaseClient')).default;
            
            // Try to find the sales_rep_id using the email
            const { data, error } = await supabase
              .from('sales_reps')
              .select('sales_rep_id, Email')
              .ilike('Email', user.email)
              .single();
              
            if (data && !error) {
              console.log('Found sales_rep_id:', data.sales_rep_id);
              // Update in-memory user object
              currentUser = { ...user, salesRepId: data.sales_rep_id };
              
              // Also update localStorage to fix for future loads
              const storedUser = JSON.parse(localStorage.getItem('sales_rep_user'));
              if (storedUser) {
                storedUser.salesRepId = data.sales_rep_id;
                localStorage.setItem('sales_rep_user', JSON.stringify(storedUser));
                console.log('Updated sales rep ID in localStorage');
              }
            } else {
              console.warn('Could not find sales_rep_id for user:', user.email);
            }
          } catch (e) {
            console.error('Error fetching sales_rep_id:', e);
          }
        }

        console.log('Attempting to fetch call logs via callsService...', { 
          sales_rep_id: currentUser?.salesRepId
        });
        
        try {
          // First try using the service, passing currentUser and authType
          const data = await fetchCallLogs(currentUser, authType);
          
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
        let query = supabase
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
          
        // If user is a sales rep, filter calls for just that rep
        if (authType === 'sales_rep' && currentUser && currentUser.salesRepId) {
          console.log('Filtering direct query for sales rep ID:', currentUser.salesRepId);
          // Direct filter on sales_rep_id column in call_logs table
          query = query.eq('sales_rep_id', currentUser.salesRepId);
        }
        
        // Execute the query
        let { data: call_logs, error } = await query;
        
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
  }, [user, authType]);

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
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
              Call Logs
            </Typography>
            {authType === 'sales_rep' && (
              <Typography variant="subtitle1" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                Showing your assigned calls only
              </Typography>
            )}
          </Box>
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
                <TableCell width="18%">Client</TableCell>
                <TableCell width="17%">Sales Rep</TableCell>
                <TableCell width="12%">Duration</TableCell>
                <TableCell width="15%">Outcome</TableCell>
                <TableCell width="23%" align="center">Actions</TableCell>
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
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title={call.hasTranscription ? "View Transcription" : "Create New Transcription"}>
                          <IconButton 
                            size="small" 
                            aria-label="transcribe" 
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
                        </Tooltip>
                        
                        {call.hasTranscription && (
                          <Tooltip title="View Call Insights">
                            <IconButton 
                              size="small" 
                              aria-label="insights" 
                              component={Link}
                              to="/dashboard/call-insights"
                              state={{ callData: call }}
                              sx={{ 
                                color: '#8a2be2',
                                bgcolor: 'rgba(138, 43, 226, 0.1)',
                                '&:hover': { 
                                  color: '#7a1cb1',
                                  bgcolor: 'rgba(138, 43, 226, 0.2)'
                                },
                                borderRadius: '50%',
                                padding: 1
                              }}
                            >
                              <AssessmentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
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