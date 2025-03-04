import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { transcribeAudio, diarizeTranscription } from '../utils/groqApiClient';
import { 
  fetchCallById, 
  fetchTranscription, 
  saveTranscription, 
  saveAudioFile, 
  getCallAudio 
} from '../utils/callsService';

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
  const [openSnackbar, setShowSnackbar] = useState(false);
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
        setShowSnackbar(true);
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
          setShowSnackbar(true);
        } else {
          // Show transcription upload option if no transcription found
          setShowTranscriptionUpload(true);
        }
        
        // Check for existing audio file using the enhanced getCallAudio function
        const audioResult = await getCallAudio(callId);
        
        if (audioResult) {
          console.log(`Found audio for call ${callId} from source: ${audioResult.source}`);
          
          if (audioResult.url) {
            setAudioUrl(audioResult.url);
          }
          
          if (audioResult.file) {
            setAudioFile(audioResult.file);
            setSuccess(`Audio file loaded from ${audioResult.source}`);
            setShowSnackbar(true);
          } else if (audioResult.needsLoading) {
            // We have a reference to a file in project storage but need to load it
            console.log(`Audio file reference found at ${audioResult.path}, will need manual loading`);
            setShowAudioUpload(true);
            setSuccess("Audio file reference found. Please select the file.");
            setShowSnackbar(true);
          }
        } else {
          // No audio found in any storage location
          setShowAudioUpload(true);
        }
        
        setInitialized(true);
        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setError("Failed to load call data or transcription");
        setShowSnackbar(true);
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
      
      // Save the audio file to multiple locations
      saveAudioFileMultiple(file);
      
      // Reset transcription data when a new file is uploaded
      if (existingTranscription) {
        // Confirm with user whether to replace existing transcription
        if (window.confirm("A transcription already exists for this call. Do you want to create a new one?")) {
          setTranscription(null);
          setDiarizedTranscription(null);
          setExistingTranscription(false);
        }
      }
      
      // Log the state for debugging
      console.log("Audio file set:", {
        filename: file.name,
        size: file.size,
        type: file.type,
        audioUrl: Boolean(url),
        existingTranscription: Boolean(existingTranscription)
      });
    }
  };
  
  // Save audio file to multiple locations
  const saveAudioFileMultiple = async (file) => {
    try {
      // Use the callsService to save the audio file
      const result = await saveAudioFile(file, callId);
      
      if (result.success) {
        setSuccess("Audio file saved to your downloads folder and project storage");
      } else {
        setSuccess("Audio file saved to your downloads folder for later use");
      }
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error saving audio file:', error);
      setError("Error saving audio file. Download created as fallback.");
      setShowSnackbar(true);
      
      // Fallback to the simple download method if the full save fails
      const fileUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `audio_${callId}_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
    }
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
          setShowSnackbar(true);
          setShowTranscriptionUpload(false);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          setError("Invalid transcription file format");
          setShowSnackbar(true);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file");
        setShowSnackbar(true);
        setLoading(false);
      };
      reader.readAsText(file);
    }
  };
  
  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  // Process the uploaded audio file
  const handleProcessAudio = async () => {
    if (!audioFile) {
      setError("Please upload an audio file first");
      setShowSnackbar(true);
      return;
    }
    
    if (!callId) {
      setError("No call ID available. Please select a call from the call records page.");
      setShowSnackbar(true);
      return;
    }
    
    // This check is now redundant since the button is only shown when there's no transcription
    // Kept for safety, but should never execute in normal flow
    if (diarizedTranscription) {
      console.warn("Process button was clicked when transcription already exists. This shouldn't happen.");
      if (!window.confirm("Do you want to create a new transcription and replace the existing one?")) {
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // This is now redundant (should never have diarizedTranscription at this point)
      // but kept for safety and future flexibility
      if (diarizedTranscription) {
        setDiarizedTranscription(null);
        setExistingTranscription(false);
      }
      
      // Make sure the audio file is saved to storage
      setProcessingStep('Saving audio file...');
      await saveAudioFileMultiple(audioFile);
      
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
      
      // Step 3: Save the transcription to all storage locations
      setProcessingStep('Saving transcription...');
      await saveTranscription(callId, diarizedResult);
      
      // Log success info
      console.log('Transcription process completed successfully:', {
        callId,
        audioFilename: audioFile.name,
        transcriptionLength: diarizedResult.length
      });
      
      setSuccess("Transcription created and saved to downloads and project folder");
      setShowSnackbar(true);
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
      setShowSnackbar(true);
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
  
  // Refs for scrolling to active segments
  const transcriptContainerRef = useRef(null);
  const activeSegmentRef = useRef(null);
  const activeWordRef = useRef(null);
  
  // Determine if a word is currently being spoken
  const isWordActive = (wordStartTime, wordEndTime) => {
    return currentTime >= wordStartTime && currentTime <= wordEndTime;
  };

  // Determine if a segment is active
  const isSegmentActive = (segmentStartTime, segmentEndTime) => {
    return currentTime >= segmentStartTime && currentTime <= segmentEndTime;
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
  
  // Auto-scroll to keep the active segment/word in view
  useEffect(() => {
    if (transcriptContainerRef.current) {
      if (activeWordRef.current) {
        // Scroll to active word
        const containerRect = transcriptContainerRef.current.getBoundingClientRect();
        const wordRect = activeWordRef.current.getBoundingClientRect();
        
        // Calculate the target scroll position to center the word
        const targetScroll = wordRect.top - containerRect.top - 
          (containerRect.height / 2) + (wordRect.height / 2) + 
          transcriptContainerRef.current.scrollTop;
        
        // Smooth scroll to the target position
        transcriptContainerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } 
      else if (activeSegmentRef.current) {
        // If no active word, scroll to active segment
        const containerRect = transcriptContainerRef.current.getBoundingClientRect();
        const segmentRect = activeSegmentRef.current.getBoundingClientRect();
        
        // Calculate the target scroll position to center the segment
        const targetScroll = segmentRect.top - containerRect.top - 
          (containerRect.height / 2) + (segmentRect.height / 2) + 
          transcriptContainerRef.current.scrollTop;
        
        // Smooth scroll to the target position
        transcriptContainerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflow: 'hidden' }}>
        {/* Header with back button and title */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4, 
          pb: 2, 
          borderBottom: '1px solid #e0e0e0',
          width: '100%'
        }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/calls')}
            sx={{
              mr: 3,
              bgcolor: 'var(--primary-color)',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': { 
                bgcolor: 'var(--primary-hover)', 
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              },
              textTransform: 'none',
              borderRadius: '8px',
              padding: '8px 16px'
            }}
          >
            Back to Calls
          </Button>
          <Box>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                color: 'var(--heading-color)', 
                fontSize: { xs: '1.5rem', sm: '2rem' },
                letterSpacing: '-0.5px'
              }}
            >
              Call Transcript
            </Typography>
            {callData && (
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '1rem',
                  fontWeight: 500 
                }}
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
        
        <Paper 
          sx={{ 
            p: 0, 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 250px)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          {(!audioFile && !diarizedTranscription && !showAudioUpload) ? (
            // Upload prompt when no file is selected
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 5,
                height: '100%',
                textAlign: 'center',
                backgroundColor: '#f9fafb'
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 40, color: 'var(--primary-color)' }} />
              </Box>
              <Typography 
                variant="h5" 
                fontWeight="600" 
                sx={{ 
                  mb: 2,
                  backgroundImage: 'linear-gradient(45deg, var(--primary-color), #6366F1)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'var(--primary-color)'
                }}
              >
                Upload Audio File
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  mb: 4, 
                  maxWidth: 500,
                  fontWeight: 400,
                  lineHeight: 1.6
                }}
              >
                To begin, please upload an audio recording of the call. Supported formats include MP3, WAV, and M4A.
              </Typography>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{ 
                  bgcolor: 'var(--primary-color)',
                  '&:hover': { bgcolor: 'var(--primary-hover)' },
                  py: 1.5,
                  px: 3,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                Select Audio File
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  onChange={handleFileChange}
                />
              </Button>
              
              {showTranscriptionUpload && (
                <Box sx={{ 
                  mt: 4,
                  p: 3,
                  borderRadius: '12px',
                  border: '1px dashed rgba(0,0,0,0.12)',
                  bgcolor: 'rgba(0,0,0,0.02)',
                  maxWidth: '400px'
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 1.5,
                      fontWeight: 500
                    }}
                  >
                    Already have a transcription file?
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUploadIcon fontSize="small" />}
                    sx={{
                      borderRadius: '6px',
                      textTransform: 'none',
                      borderColor: 'var(--primary-color)',
                      color: 'var(--primary-color)',
                      '&:hover': {
                        borderColor: 'var(--primary-hover)',
                        bgcolor: 'rgba(79, 70, 229, 0.04)'
                      }
                    }}
                  >
                    Upload Transcription
                    <input
                      type="file"
                      hidden
                      accept="application/json"
                      onChange={handleTranscriptionFileUpload}
                    />
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            // Main content when file is selected or transcription exists
            <>
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, bgcolor: 'rgba(0,0,0,0.05)', fontSize: '10px', zIndex: 1000 }}>
                  <div>audioFile: {audioFile ? '✓' : '✗'}</div>
                  <div>audioUrl: {audioUrl ? '✓' : '✗'}</div>
                  <div>diarizedTranscription: {diarizedTranscription ? '✓' : '✗'}</div>
                </Box>
              )}
              {/* Top panel with audio player */}
              <Box sx={{ 
                p: 3, 
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f9fafb',
                boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)'
              }}>
                {/* Left side - Audio player */}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {audioUrl && (
                  <>
                    <audio 
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      style={{ display: 'none' }}
                    />
                    
                    {/* Play/pause button */}
                    <Box sx={{ mr: 3 }}>
                      <IconButton 
                        onClick={togglePlayPause}
                        sx={{ 
                          color: 'white',
                          bgcolor: 'var(--primary-color)',
                          p: 1.5,
                          width: 56,
                          height: 56,
                          boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                          '&:hover': { 
                            bgcolor: 'var(--primary-hover)', 
                            transform: 'scale(1.05)',
                            boxShadow: '0 6px 15px rgba(79, 70, 229, 0.4)'
                          },
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                      >
                        {isPlaying ? <PauseIcon fontSize="medium" /> : <PlayArrowIcon fontSize="medium" />}
                      </IconButton>
                    </Box>
                    
                    {/* Progress bar and time display */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                          {audioFile?.name || "Audio Recording"}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'var(--primary-color)',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px',
                            bgcolor: 'rgba(79, 70, 229, 0.08)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '4px'
                          }}
                        >
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>
                      </Box>
                      
                      {/* Progress Bar */}
                      <Box sx={{ 
                        position: 'relative', 
                        height: 8, 
                        borderRadius: 4, 
                        bgcolor: 'rgba(0,0,0,0.06)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: '100%',
                            cursor: 'pointer',
                            zIndex: 2
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
                            backgroundImage: 'linear-gradient(90deg, var(--primary-color), #6366F1)',
                            borderRadius: 4,
                            transition: 'width 0.1s',
                            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              right: -6,
                              top: -4,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: 'white',
                              border: '2px solid var(--primary-color)',
                              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.4)',
                              zIndex: 3
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </>
                )}
                
                </Box>
                
                {/* Right side - Processing controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  {loading && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      bgcolor: 'rgba(79, 70, 229, 0.08)',
                      px: 2,
                      py: 1,
                      borderRadius: '8px'
                    }}>
                      <CircularProgress 
                        size={24} 
                        sx={{ 
                          color: 'var(--primary-color)',
                          animationDuration: '0.8s'
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        fontWeight="600"
                        sx={{ color: 'var(--primary-color)' }}
                      >
                        {processingStep}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Process button - only shown when audio exists but transcription doesn't */}
                  {audioFile && !diarizedTranscription && !loading && (
                    <Tooltip title="Process audio to create transcription">
                      <Button
                        variant="contained"
                        onClick={handleProcessAudio}
                        sx={{ 
                          bgcolor: 'var(--primary-color)',
                          '&:hover': { 
                            bgcolor: 'var(--primary-hover)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 12px rgba(79, 70, 229, 0.3)'
                          },
                          px: 3,
                          py: 1.2,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: '0 4px 8px rgba(79, 70, 229, 0.2)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Process Audio
                      </Button>
                    </Tooltip>
                  )}
                  
                  {/* Show audio upload button if needed */}
                  {(!audioFile && showAudioUpload) && (
                    <Button
                      component="label"
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      sx={{ 
                        bgcolor: 'var(--primary-color)',
                        '&:hover': { 
                          bgcolor: 'var(--primary-hover)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 12px rgba(79, 70, 229, 0.3)'
                        },
                        px: 3,
                        py: 1.2,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 8px rgba(79, 70, 229, 0.2)',
                        transition: 'all 0.3s ease'
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
              
              {/* Transcript content area */}
              {diarizedTranscription && (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex',
                  flexDirection: 'column',
                  p: 0,
                  backgroundColor: '#ffffff',
                  position: 'relative'
                }}>
                  <Box sx={{ 
                    p: 3, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f0f0f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="700"
                      sx={{
                        color: 'var(--heading-color)',
                        letterSpacing: '-0.3px'
                      }}
                    >
                      Transcript
                    </Typography>
                    
                    {existingTranscription && (
                      <Tooltip title="Transcription saved to project storage">
                        <Chip 
                          icon={<CheckCircleIcon />}
                          label="Saved" 
                          color="success"
                          size="small"
                          sx={{
                            fontWeight: 500,
                            px: 1,
                            '& .MuiChip-icon': {
                              fontSize: '1rem'
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  
                  {/* Transcript content with center indicator line */}
                  <Box 
                    sx={{
                      position: 'relative'
                    }}
                  >
                    {/* Center highlight indicator */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 'calc(50% - 12px)',
                        left: '150px',
                        right: '16px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px dashed rgba(79, 70, 229, 0.2)',
                        backgroundColor: 'rgba(79, 70, 229, 0.03)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Scrollable transcript container */}
                    <Box 
                      ref={transcriptContainerRef}
                      sx={{ 
                        p: 4,
                        maxHeight: 'calc(100vh - 380px)',
                        overflowY: 'auto',
                        scrollBehavior: 'smooth',
                        paddingBottom: 'calc(30vh)',
                        paddingTop: 'calc(25vh)',
                        position: 'relative',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          borderRadius: '10px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          borderRadius: '10px',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.3)'
                          }
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '25vh',
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.9) 60%, rgba(255,255,255,1))',
                          pointerEvents: 'none'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '25vh',
                          background: 'linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.9) 60%, rgba(255,255,255,1))',
                          pointerEvents: 'none',
                          zIndex: 2
                        }
                      }}
                  >
                    {diarizedTranscription.map((segment, index) => (
                      <Box 
                        key={index}
                        ref={isSegmentActive(segment.start_time, segment.end_time) ? activeSegmentRef : null}
                        sx={{ 
                          mb: 4,
                          display: 'flex',
                          width: '100%'
                        }}
                      >
                        <Box 
                          sx={{ 
                            minWidth: '120px', 
                            mr: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: segment.speaker === 'Speaker 1' ? 'var(--primary-color)' : '#E57373',
                              color: 'white',
                              width: '110px',
                              textAlign: 'center',
                              py: 1.2,
                              borderRadius: '8px',
                              mb: 1.5,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              boxShadow: segment.speaker === 'Speaker 1' 
                                ? '0 3px 8px rgba(79, 70, 229, 0.25)' 
                                : '0 3px 8px rgba(229, 115, 115, 0.25)',
                              letterSpacing: '0.3px'
                            }}
                          >
                            {segment.speaker}
                          </Box>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => jumpToTime(segment.start_time)}
                            startIcon={<PlayArrowIcon fontSize="small" />}
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              p: 0.5,
                              minWidth: 0,
                              borderRadius: '16px',
                              '&:hover': { 
                                bgcolor: 'rgba(0,0,0,0.04)', 
                                color: 'var(--primary-color)' 
                              },
                              fontFamily: 'monospace',
                              border: '1px solid rgba(0,0,0,0.08)'
                            }}
                          >
                            {formatTime(segment.start_time)}
                          </Button>
                        </Box>
                        
                        <Box
                          sx={{
                            flex: 1,
                            p: 3,
                            borderRadius: '12px',
                            bgcolor: currentTime >= segment.start_time && currentTime <= segment.end_time 
                              ? (segment.speaker === 'Speaker 1' ? 'var(--primary-light)' : '#FFEBEE')
                              : '#f9fafb',
                            transition: 'all 0.3s ease',
                            boxShadow: currentTime >= segment.start_time && currentTime <= segment.end_time
                              ? (segment.speaker === 'Speaker 1' 
                                ? '0 4px 12px rgba(79, 70, 229, 0.15)' 
                                : '0 4px 12px rgba(229, 115, 115, 0.15)')
                              : '0 1px 3px rgba(0,0,0,0.05)',
                            border: '1px solid',
                            borderColor: currentTime >= segment.start_time && currentTime <= segment.end_time
                              ? (segment.speaker === 'Speaker 1' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(229, 115, 115, 0.2)')
                              : 'rgba(0,0,0,0.05)',
                            position: 'relative',
                            transformOrigin: 'center',
                            transform: currentTime >= segment.start_time && currentTime <= segment.end_time
                              ? 'scale(1.02)'
                              : 'scale(1)',
                            zIndex: currentTime >= segment.start_time && currentTime <= segment.end_time ? 10 : 1
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              lineHeight: 1.7,
                              color: 'text.primary',
                              wordBreak: 'break-word',
                              fontSize: '1rem',
                              fontWeight: 400,
                              letterSpacing: '0.015em'
                            }}
                          >
                            {/* If transcription has word-level timestamps, use them for highlighting */}
                            {segment.words ? (
                              segment.words.map((word, wordIndex) => (
                                <span 
                                  key={wordIndex}
                                  ref={isWordActive(word.start_time, word.end_time) ? activeWordRef : null}
                                  style={{
                                    fontWeight: isWordActive(word.start_time, word.end_time) ? 700 : 400,
                                    backgroundColor: isWordActive(word.start_time, word.end_time) 
                                      ? (segment.speaker === 'Speaker 1' ? 'var(--primary-color)' : '#E57373') 
                                      : 'transparent',
                                    color: isWordActive(word.start_time, word.end_time) ? 'white' : 'inherit',
                                    padding: isWordActive(word.start_time, word.end_time) ? '3px 6px' : '2px 0',
                                    borderRadius: '4px',
                                    marginRight: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isWordActive(word.start_time, word.end_time) 
                                      ? (segment.speaker === 'Speaker 1' 
                                        ? '0 2px 5px rgba(79, 70, 229, 0.3)' 
                                        : '0 2px 5px rgba(229, 115, 115, 0.3)') 
                                      : 'none',
                                    display: 'inline-block',
                                    position: 'relative'
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
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
        
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
      </Box>
    </DashboardLayout>
  );
};

export default CallTranscription;