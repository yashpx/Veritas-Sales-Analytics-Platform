import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  CircularProgress, 
  IconButton,
  Alert,
  Snackbar,
  Divider,
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { transcribeAudio, diarizeTranscription } from '../utils/groqApiClient';
import { fetchCallById, saveTranscription, fetchTranscription, uploadCallAudio, getCallAudioUrl } from '../utils/callsService';
import '../styles/dashboard.css';

const CallTranscription = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  
  // Get call data from state or fetch it
  const [callData, setCallData] = useState(location.state?.callData || null);
  const [callId, setCallId] = useState(location.state?.callData?.id || null);
  
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [success, setSuccess] = useState(null);
  
  const [transcription, setTranscription] = useState(null);
  const [diarizedTranscription, setDiarizedTranscription] = useState(null);
  const [existingTranscription, setExistingTranscription] = useState(false);
  
  // Initialize - fetch call data and existing transcription if call ID is available
  useEffect(() => {
    const initialize = async () => {
      if (!callId) {
        setError("No call selected. Please select a call from the call records page.");
        setOpenSnackbar(true);
        return;
      }
      
      try {
        setLoading(true);
        
        // If we don't have the call data, fetch it
        if (!callData) {
          const fetchedCall = await fetchCallById(callId);
          setCallData(fetchedCall);
        }
        
        // Check for existing transcription
        const existingTranscript = await fetchTranscription(callId);
        if (existingTranscript) {
          setDiarizedTranscription(existingTranscript);
          setExistingTranscription(true);
          setSuccess("Existing transcription loaded");
          setOpenSnackbar(true);
        }
        
        // Check for existing audio file
        const audioFileUrl = await getCallAudioUrl(callId);
        if (audioFileUrl) {
          setAudioUrl(audioFileUrl);
        }
        
        setInitialized(true);
        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setError("Failed to load call data or transcription");
        setOpenSnackbar(true);
        setLoading(false);
      }
    };
    
    if (callId && !initialized) {
      initialize();
    }
  }, [callId, callData, initialized]);
  
  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Reset transcription data when a new file is uploaded
      if (existingTranscription) {
        // Confirm with user whether to replace existing transcription
        if (window.confirm("A transcription already exists for this call. Do you want to create a new one?")) {
          setTranscription(null);
          setDiarizedTranscription(null);
          setExistingTranscription(false);
        }
      }
    }
  };
  
  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Process the uploaded audio file
  const handleProcessAudio = async () => {
    if (!audioFile) {
      setError("Please upload an audio file first");
      setOpenSnackbar(true);
      return;
    }
    
    if (!callId) {
      setError("No call ID available. Please select a call from the call records page.");
      setOpenSnackbar(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Step 0: Upload audio file to storage
      setProcessingStep('Uploading audio file...');
      await uploadCallAudio(audioFile, callId);
      
      // Step 1: Transcribe the audio using Groq's Whisper API endpoint
      setProcessingStep('Transcribing audio...');
      const transcriptionResult = await transcribeAudio(audioFile);
      setTranscription(transcriptionResult);
      
      // Step 2: Diarize the transcription using Groq's LLM
      setProcessingStep('Identifying speakers...');
      const diarizedResult = await diarizeTranscription(transcriptionResult);
      
      // The diarizeTranscription function now handles parsing and validation
      // and always returns an array
      setDiarizedTranscription(diarizedResult);
      
      // Step 3: Save the transcription to the database
      setProcessingStep('Saving transcription...');
      await saveTranscription(callId, diarizedResult);
      
      setSuccess("Transcription created and saved successfully");
      setOpenSnackbar(true);
      setLoading(false);
      setExistingTranscription(true);
    } catch (error) {
      console.error('Error processing audio:', error);
      setLoading(false);
      setError(
        error.response?.status === 401 
          ? 'API key authentication failed. Please check your Groq API key.'
          : 'Error processing the audio. Please try again or use a different file.'
      );
      setOpenSnackbar(true);
    }
  };
  
  // Audio player controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Update current time as audio plays
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  // Set audio duration when metadata is loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Format time in seconds to MM:SS format
  const formatTime = (time) => {
    if (!time && time !== 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Determine if a word is currently being spoken
  const isWordActive = (wordStartTime, wordEndTime) => {
    return currentTime >= wordStartTime && currentTime <= wordEndTime;
  };
  
  // Jump to a specific point in the audio
  const jumpToTime = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  
  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            aria-label="back" 
            sx={{ mr: 2 }}
            onClick={() => navigate('/dashboard/calls')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
            Call Transcription
            {callData && (
              <Typography 
                component="span" 
                variant="h6" 
                sx={{ ml: 2, color: 'text.secondary', fontWeight: 'normal' }}
              >
                - {callData.client}
              </Typography>
            )}
          </Typography>
        </Box>
        
        {callData && (
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={`Sales Rep: ${callData.salesRep}`} 
              variant="outlined" 
              size="small"
            />
            <Chip 
              label={`Date: ${formatDate(callData.date)}`} 
              variant="outlined" 
              size="small" 
            />
            <Chip 
              label={`Duration: ${callData.duration} min`} 
              variant="outlined" 
              size="small"
            />
            <Chip 
              label={`Outcome: ${callData.outcome}`} 
              color={
                callData.outcome.toLowerCase() === 'closed' ? 'success' : 
                callData.outcome.toLowerCase() === 'in-progress' ? 'warning' : 'error'
              }
              size="small"
            />
            {existingTranscription && (
              <Chip 
                icon={<CheckCircleIcon />}
                label="Transcribed" 
                color="primary"
                size="small"
              />
            )}
          </Box>
        )}
        
        <Grid container spacing={3}>
          {/* Audio Upload and Player Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="600">
                  {audioFile ? audioFile.name : (audioUrl ? "Audio Recording" : "Upload Audio File")}
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  sx={{ 
                    bgcolor: 'var(--primary-color)',
                    '&:hover': { bgcolor: 'var(--primary-hover)' }
                  }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    accept="audio/*"
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>
              
              {audioUrl && (
                <Box sx={{ mt: 3, mb: 2 }}>
                  <audio 
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    style={{ display: 'none' }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <IconButton 
                      onClick={togglePlayPause}
                      sx={{ 
                        color: 'var(--primary-color)',
                        bgcolor: 'var(--primary-light)',
                        mr: 2,
                        '&:hover': { bgcolor: 'var(--primary-hover)', opacity: 0.9 }
                      }}
                    >
                      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Box sx={{ flexGrow: 1, mx: 2 }}>
                      <Box
                        sx={{
                          height: '4px',
                          width: '100%',
                          bgcolor: 'rgba(0,0,0,0.1)',
                          borderRadius: '2px',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const offsetX = e.clientX - rect.left;
                          const newTime = (offsetX / rect.width) * duration;
                          if (audioRef.current) {
                            audioRef.current.currentTime = newTime;
                          }
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${(currentTime / duration) * 100}%`,
                            bgcolor: 'var(--primary-color)',
                            borderRadius: '2px',
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 70 }}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {audioFile && !existingTranscription && !loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleProcessAudio}
                    sx={{ 
                      bgcolor: 'var(--primary-color)',
                      '&:hover': { bgcolor: 'var(--primary-hover)' }
                    }}
                  >
                    Process Audio
                  </Button>
                </Box>
              )}
              
              {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
                  <CircularProgress sx={{ mb: 2, color: 'var(--primary-color)' }} />
                  <Typography variant="body1">{processingStep}</Typography>
                </Box>
              )}
              
              <Snackbar 
                open={openSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
              >
                <Alert 
                  onClose={handleCloseSnackbar} 
                  severity={error ? "error" : "success"} 
                  variant="filled"
                  sx={{ width: '100%' }}
                >
                  {error || success}
                </Alert>
              </Snackbar>
            </Paper>
          </Grid>
          
          {/* Transcription Display Section */}
          {diarizedTranscription && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3
                  }}
                >
                  <Typography variant="h6" fontWeight="600">
                    Transcription
                  </Typography>
                  {existingTranscription && (
                    <Chip 
                      icon={<CheckCircleIcon />}
                      label="Saved" 
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
                
                <Box sx={{ maxHeight: '500px', overflowY: 'auto', pr: 2 }}>
                  {diarizedTranscription.map((segment, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: 3,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          gap: 2
                        }}
                      >
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            color: segment.speaker === 'Speaker 1' ? 'var(--primary-color)' : '#E57373'
                          }}
                        >
                          {segment.speaker}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => jumpToTime(segment.start_time)}
                        >
                          {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          lineHeight: 1.7,
                          ml: 2,
                          borderLeft: `3px solid ${segment.speaker === 'Speaker 1' ? 'var(--primary-light)' : '#FFCDD2'}`,
                          pl: 2,
                          pb: 1,
                          pt: 1,
                          bgcolor: currentTime >= segment.start_time && currentTime <= segment.end_time 
                            ? (segment.speaker === 'Speaker 1' ? 'var(--primary-light)' : '#FFEBEE')
                            : 'transparent',
                          borderRadius: '0 4px 4px 0',
                          transition: 'background-color 0.3s ease'
                        }}
                      >
                        {/* If transcription has word-level timestamps, use them for highlighting */}
                        {segment.words ? (
                          segment.words.map((word, wordIndex) => (
                            <span 
                              key={wordIndex}
                              style={{
                                fontWeight: isWordActive(word.start_time, word.end_time) ? 700 : 400,
                                backgroundColor: isWordActive(word.start_time, word.end_time) 
                                  ? (segment.speaker === 'Speaker 1' ? 'var(--primary-color)' : '#EF5350') 
                                  : 'transparent',
                                color: isWordActive(word.start_time, word.end_time) ? 'white' : 'inherit',
                                padding: isWordActive(word.start_time, word.end_time) ? '2px 4px' : '2px 0',
                                borderRadius: '3px',
                                marginRight: '4px',
                                transition: 'all 0.15s ease-in-out',
                                cursor: 'pointer'
                              }}
                              onClick={() => jumpToTime(word.start_time)}
                            >
                              {word.text}
                            </span>
                          ))
                        ) : (
                          segment.text
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default CallTranscription;