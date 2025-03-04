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
import { fetchCallById, fetchTranscription } from '../utils/callsService';
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
  const [showTranscriptionUpload, setShowTranscriptionUpload] = useState(false);
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  
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
        
        // Check for existing transcription in localStorage
        const existingTranscript = await fetchTranscription(callId);
        if (existingTranscript) {
          setDiarizedTranscription(existingTranscript);
          setExistingTranscription(true);
          setSuccess("Existing transcription loaded");
          setOpenSnackbar(true);
        } else {
          // Show transcription upload option if no transcription found
          setShowTranscriptionUpload(true);
        }
        
        // Check for existing audio file in localStorage
        const storedAudioUrl = localStorage.getItem(`audio_${callId}`);
        if (storedAudioUrl) {
          // Restore audio file from data URL
          console.log(`Found stored audio for call ${callId}`);
          setAudioUrl(storedAudioUrl);
          
          // Create a File object from the data URL
          try {
            const filename = localStorage.getItem(`audio_${callId}_filename`) || `audio_${callId}.mp3`;
            const filetype = localStorage.getItem(`audio_${callId}_type`) || 'audio/mpeg';
            
            // Convert data URL to blob
            const res = await fetch(storedAudioUrl);
            const blob = await res.blob();
            
            // Create a File object 
            const file = new File([blob], filename, { type: filetype });
            setAudioFile(file);
            
            setSuccess("Audio file loaded from storage");
            setOpenSnackbar(true);
          } catch (error) {
            console.error('Error recreating audio file:', error);
            // We still have the audio URL, so playback should work even if we
            // can't reconstruct the File object
          }
        } else {
          // Check if we should show audio upload option
          setShowAudioUpload(true);
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
  
  // Handle audio file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Save the audio file to localStorage (as a data URL)
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store audio file as data URL in localStorage
        try {
          localStorage.setItem(`audio_${callId}`, reader.result);
          console.log(`Audio file saved to localStorage for call ${callId}`);
          
          // Also save file name and type
          localStorage.setItem(`audio_${callId}_filename`, file.name);
          localStorage.setItem(`audio_${callId}_type`, file.type);
        } catch (error) {
          console.warn('Failed to save audio to localStorage:', error);
          // It might fail due to size limitations, so we'll create a download as backup
          saveAudioFileLocally(file);
        }
      };
      reader.readAsDataURL(file);
      
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
  
  // Save audio file locally through download
  const saveAudioFileLocally = (file) => {
    // Create a download for the audio file
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = fileUrl;
    // Use callId in the filename for easy reference
    link.download = `audio_${callId}_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
    
    setSuccess("Audio file saved to your downloads folder for later use");
    setOpenSnackbar(true);
  };
  
  // Handle transcription file upload
  const handleTranscriptionFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedData = JSON.parse(e.target.result);
          // Save to localStorage for future use
          localStorage.setItem(`transcription_${callId}`, e.target.result);
          setDiarizedTranscription(parsedData);
          setExistingTranscription(true);
          setSuccess("Transcription file loaded successfully");
          setOpenSnackbar(true);
          setShowTranscriptionUpload(false);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          setError("Invalid transcription file format");
          setOpenSnackbar(true);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file");
        setOpenSnackbar(true);
        setLoading(false);
      };
      reader.readAsText(file);
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
      
      // Make sure the audio file is saved to localStorage
      if (!localStorage.getItem(`audio_${callId}`)) {
        setProcessingStep('Saving audio file...');
        // Save audio to localStorage
        const reader = new FileReader();
        const audioSavePromise = new Promise((resolve, reject) => {
          reader.onloadend = () => {
            try {
              localStorage.setItem(`audio_${callId}`, reader.result);
              localStorage.setItem(`audio_${callId}_filename`, audioFile.name);
              localStorage.setItem(`audio_${callId}_type`, audioFile.type);
              resolve();
            } catch (error) {
              console.warn('Failed to save audio to localStorage, likely too large', error);
              // Save as download instead
              saveAudioFileLocally(audioFile);
              resolve();
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(audioFile);
        });
        
        await audioSavePromise;
      }
      
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
      
      // Step 3: Save the transcription locally
      setProcessingStep('Saving transcription...');
      // Create a downloadable file
      const transcriptionJson = JSON.stringify(diarizedResult);
      localStorage.setItem(`transcription_${callId}`, transcriptionJson);
      
      // Create download link for transcription
      const blob = new Blob([transcriptionJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcription_${callId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess("Transcription created and saved to your downloads folder");
      setOpenSnackbar(true);
      setLoading(false);
      setExistingTranscription(true);
      setShowTranscriptionUpload(false);
      setShowAudioUpload(false);
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
      <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
        {/* Header with back button and title */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4, 
          pb: 2, 
          borderBottom: '1px solid #e0e0e0' 
        }}>
          <IconButton 
            aria-label="back" 
            sx={{ 
              mr: 2,
              color: 'var(--primary-color)',
              bgcolor: 'var(--primary-light)',
              '&:hover': { bgcolor: 'var(--primary-hover)', opacity: 0.8 }
            }}
            onClick={() => navigate('/dashboard/calls')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
              Call Transcription
            </Typography>
            {callData && (
              <Typography 
                variant="subtitle1" 
                sx={{ color: 'text.secondary' }}
              >
                {callData.client} • {formatDate(callData.date)}
              </Typography>
            )}
          </Box>
        </Box>
        
        {callData && (
          <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={`Sales Rep: ${callData.salesRep}`} 
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
        
        <Grid container spacing={3} sx={{ maxWidth: '100%' }}>
          {/* Audio Upload and Player Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="600">
                  {audioFile ? audioFile.name : (audioUrl ? "Audio Recording" : "Upload Audio File")}
                </Typography>
                {/* Only show the upload button if no audio file or in an explicit upload state */}
                {(!audioFile && !audioUrl) && (
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    sx={{ 
                      bgcolor: 'var(--primary-color)',
                      '&:hover': { bgcolor: 'var(--primary-hover)' }
                    }}
                  >
                    Upload Audio
                    <input
                      type="file"
                      hidden
                      accept="audio/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                )}
              </Box>
              
              {/* Enhanced Audio Player */}
              {audioUrl && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <audio 
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    style={{ display: 'none' }}
                  />
                  
                  {/* Audio Player Controls */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    p: 2, 
                    borderRadius: 3, 
                    bgcolor: 'var(--primary-light)', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    {/* Playback Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <IconButton 
                        onClick={togglePlayPause}
                        sx={{ 
                          color: 'white',
                          bgcolor: 'var(--primary-color)',
                          p: 1.5,
                          mr: 2,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          '&:hover': { bgcolor: 'var(--primary-hover)' }
                        }}
                      >
                        {isPlaying ? <PauseIcon fontSize="medium" /> : <PlayArrowIcon fontSize="medium" />}
                      </IconButton>
                      
                      <Typography variant="body1" fontWeight="500" sx={{ color: 'var(--primary-color)' }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </Typography>
                    </Box>
                    
                    {/* Progress Bar */}
                    <Box sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)', mb: 1 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const offsetX = e.clientX - rect.left;
                          const newTime = (offsetX / rect.width) * duration;
                          if (audioRef.current) {
                            audioRef.current.currentTime = newTime;
                          }
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${(currentTime / duration) * 100}%`,
                          bgcolor: 'var(--primary-color)',
                          borderRadius: 4,
                          transition: 'width 0.1s',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            right: -6,
                            top: -2,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: 'white',
                            border: '2px solid var(--primary-color)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
              
              {/* Processing Button or Transcription Upload */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                {audioFile && !existingTranscription && !loading && (
                  <Button
                    variant="contained"
                    onClick={handleProcessAudio}
                    size="large"
                    sx={{ 
                      bgcolor: 'var(--primary-color)',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'var(--primary-hover)' }
                    }}
                  >
                    Process Audio
                  </Button>
                )}
                
                {/* Show transcription upload button if needed */}
                {showTranscriptionUpload && !existingTranscription && !loading && (
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ ml: audioFile ? 2 : 0 }}
                  >
                    Upload Transcription
                    <input
                      type="file"
                      hidden
                      accept="application/json"
                      onChange={handleTranscriptionFileUpload}
                    />
                  </Button>
                )}
              </Box>
              
              {/* Loading indicator */}
              {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
                  <CircularProgress size={40} sx={{ mb: 2, color: 'var(--primary-color)' }} />
                  <Typography variant="body1" fontWeight="500">{processingStep}</Typography>
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
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3,
                    pb: 2,
                    borderBottom: '1px solid #f0f0f0'
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
                
                <Box sx={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'hidden', pr: 2 }}>
                  {diarizedTranscription.map((segment, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        maxWidth: '100%'
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
                            color: segment.speaker === 'Speaker 1' ? 'var(--primary-color)' : '#E57373',
                            minWidth: '80px'
                          }}
                        >
                          {segment.speaker}
                        </Typography>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => jumpToTime(segment.start_time)}
                          startIcon={<PlayArrowIcon fontSize="small" />}
                          sx={{ 
                            color: 'var(--primary-color)',
                            fontSize: '0.8rem',
                            p: 0,
                            minWidth: 0,
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                        </Button>
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          lineHeight: 1.7,
                          ml: 2,
                          borderLeft: `3px solid ${segment.speaker === 'Speaker 1' ? 'var(--primary-color)' : '#E57373'}`,
                          pl: 2,
                          pb: 1.5,
                          pt: 1.5,
                          bgcolor: currentTime >= segment.start_time && currentTime <= segment.end_time 
                            ? (segment.speaker === 'Speaker 1' ? 'var(--primary-light)' : '#FFEBEE')
                            : 'transparent',
                          borderRadius: '0 4px 4px 0',
                          transition: 'background-color 0.3s ease',
                          wordBreak: 'break-word'
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
                                  ? (segment.speaker === 'Speaker 1' ? 'var(--primary-color)' : '#E57373') 
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