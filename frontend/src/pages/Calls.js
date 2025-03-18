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
    // Fetch calls from Supabase using the callsService
    const loadCallLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the callsService to fetch call logs
        const data = await fetchCallLogs();
        
        // The fetchCallLogs service already includes the hasTranscription property
        // But for backward compatibility, still check localStorage
        const formattedCalls = data.map(call => {
          // If call already has hasTranscription from database, use that
          const hasTransFromDb = call.hasTranscription || false;
          
          // For backward compatibility, still check localStorage
          let hasTransFromLocal = false;
          
          // Check if we have a transcription flag in localStorage
          const transcriptionFlag = localStorage.getItem(`transcription_flag_${call.id}`);
          if (transcriptionFlag === 'true') {
            hasTransFromLocal = true;
          }
          
          // Also check if transcription metadata exists in localStorage
          const transcriptionMetadata = localStorage.getItem(`call_${call.id}_transcription_metadata`);
          if (transcriptionMetadata) {
            try {
              const metadata = JSON.parse(transcriptionMetadata);
              if (metadata.has_transcription) {
                hasTransFromLocal = true;
              }
            } catch (e) {
              // Skip if metadata is invalid JSON
              console.error(`Error parsing transcription metadata for call ${call.id}:`, e);
            }
          }
          
          // Use either database or localStorage flag, whichever indicates the presence of a transcription
          return {
            ...call,
            hasTranscription: hasTransFromDb || hasTransFromLocal
          };
        });
        
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