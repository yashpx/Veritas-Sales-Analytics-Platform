import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, 
  InputAdornment, IconButton, Button, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchCallLogs } from '../utils/callsService';
import insightsButtonImg from '../assets/insights-button.svg';
import '../styles/dashboard.css';

const Calls = () => {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCallLogs = async () => {
      try {
        setLoading(true);
        const logs = await fetchCallLogs();
        
        // Add mock data for demonstration
        const enhancedLogs = logs.length > 0 ? logs : generateMockCallLogs();
        setCallLogs(enhancedLogs);
        setError(null);
      } catch (err) {
        console.error('Error loading call logs:', err);
        setError('Failed to load call logs. Please try again later.');
        // Use mock data if API fails
        setCallLogs(generateMockCallLogs());
      } finally {
        setLoading(false);
      }
    };

    loadCallLogs();
  }, []);

  // Generate mock call logs for demonstration
  const generateMockCallLogs = () => {
    const salesReps = ['Petra Garcia', 'Edward Wilson', 'Diana Parker', 'Alice Johnson'];
    const clients = ['Thomas Cooper', 'Leo Evans', 'Grace Phillips', 'Rita Carter', 'Ana Martin', 'Jacob Lewis', 'John Doe', 'Sarah Miller', 'Benjamin Lopez', 'Alexander Young'];
    const outcomes = ['Closed', 'Closed', 'Closed', 'Closed', 'Closed', 'Fail', 'Fail', 'Closed', 'In-progress', 'Fail'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      return {
        id: `call-${i + 1}`,
        date: date.toISOString(),
        client: clients[i % clients.length],
        salesRep: salesReps[i % salesReps.length],
        duration: Math.floor(Math.random() * 20) + 5, // 5-25 minutes
        outcome: outcomes[i % outcomes.length],
        hasTranscription: Math.random() > 0.3, // 70% chance of having transcription
        audioUrl: 'https://example.com/audio.mp3',
      };
    });
  };

  // Filter call logs based on search query
  const filteredCalls = useMemo(() => {
    if (!searchQuery.trim()) return callLogs;
    
    const query = searchQuery.toLowerCase();
    return callLogs.filter(call => 
      call.client?.toLowerCase().includes(query) ||
      call.salesRep?.toLowerCase().includes(query) ||
      new Date(call.date).toLocaleDateString().includes(query) ||
      call.outcome?.toLowerCase().includes(query)
    );
  }, [callLogs, searchQuery]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: 'var(--heading-color)' }}>
          Call Logs
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'var(--text-secondary)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: '300px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
        </Box>
        
        {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFF4F4', color: '#D32F2F', borderRadius: 2 }}>
            <Typography>{error}</Typography>
          </Paper>
        )}
        
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell width="15%">Date</TableCell>
                <TableCell width="20%">Client</TableCell>
                <TableCell width="20%">Sales Rep</TableCell>
                <TableCell width="10%">Duration</TableCell>
                <TableCell width="15%">Outcome</TableCell>
                <TableCell width="10%" align="center">Actions</TableCell>
                <TableCell width="10%" align="center">Insights</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} sx={{ color: 'var(--primary-color)', mr: 2 }} />
                    Loading call records...
                  </TableCell>
                </TableRow>
              ) : filteredCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                      <IconButton 
                        size="small" 
                        aria-label="transcribe" 
                        title={call.hasTranscription ? "View Transcription" : "Create New Transcription"}
                        component={Link}
                        to="/dashboard/call-transcription"
                        state={{ callData: call }}
                        sx={{ 
                          color: call.hasTranscription ? '#4CAF50' : '#9E9E9E',
                          '&:hover': { 
                            color: call.hasTranscription ? '#2E7D32' : '#4A90E2',
                          }
                        }}
                      >
                        {call.hasTranscription ? (
                          <HeadphonesIcon fontSize="small" />
                        ) : (
                          <MicOffIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <Link 
                        to="/dashboard/call-insights" 
                        state={{ callData: call }}
                        style={{ textDecoration: 'none' }}
                      >
                        <img 
                          src={insightsButtonImg} 
                          alt="Insights" 
                          style={{ 
                            height: '36px',
                            cursor: 'pointer'
                          }} 
                        />
                      </Link>
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