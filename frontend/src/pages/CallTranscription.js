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
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
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
import { cleanTranscriptWithGroq } from '../utils/groqApiClient';

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
  const [showSimpleTranscript, setShowSimpleTranscript] = useState(false);

  // Computed state to check if we have a valid transcription
  const hasValidTranscription = diarizedTranscription && 
    Array.isArray(diarizedTranscription) && 
    diarizedTranscription.length > 0;
  
  // Flag to determine when to show the Transcribe button
  const showTranscribeButton = audioFile && !hasValidTranscription && !loading;
  
  // Update showSimpleTranscript state based on conditions
  useEffect(() => {
    // Set showSimpleTranscript when we have a valid transcription but no audio
    if (hasValidTranscription && !audioFile) {
      setShowSimpleTranscript(true);
    } else {
      setShowSimpleTranscript(false);
    }
  }, [hasValidTranscription, audioFile]);

  // Force logging for debugging
  useEffect(() => {
    console.log("Simple transcript view status:", {
      showSimpleTranscript,
      hasValidTranscription: !!hasValidTranscription,
      audioFile: !!audioFile,
      diarizedTranscription: diarizedTranscription ? 
        (Array.isArray(diarizedTranscription) ? `Array[${diarizedTranscription.length}]` : typeof diarizedTranscription) 
        : null
    });
  }, [showSimpleTranscript, hasValidTranscription, audioFile, diarizedTranscription]);
  
  // Helper to normalize transcription data from different formats
  const getProcessedTranscription = () => {
    if (!diarizedTranscription) return [];
    
    // If it's already in our expected array format
    if (Array.isArray(diarizedTranscription) && 
        diarizedTranscription.length > 0 && 
        diarizedTranscription[0].speaker) {
      return diarizedTranscription;
    }
    
    // If it's a string (JSON), try to parse it
    if (typeof diarizedTranscription === 'string') {
      try {
        const parsed = JSON.parse(diarizedTranscription);
        if (parsed.conversation && Array.isArray(parsed.conversation)) {
          return parsed.conversation.map((item, index) => ({
            speaker: item.speaker || `Speaker ${index % 2 + 1}`,
            text: item.text || "",
            start_time: index, // Dummy values for compatibility
            end_time: index + 1
          }));
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing transcription string:", e);
        return [];
      }
    }
    
    // If it's an object with conversation array
    if (diarizedTranscription.conversation && Array.isArray(diarizedTranscription.conversation)) {
      return diarizedTranscription.conversation.map((item, index) => ({
        speaker: item.speaker || `Speaker ${index % 2 + 1}`,
        text: item.text || "",
        start_time: index, // Dummy values for compatibility
        end_time: index + 1
      }));
    }
    
    // Default fallback
    return diarizedTranscription;
  };
  
  // Debug logging for component state
  useEffect(() => {
    console.log("Component state:", {
      audioFile: !!audioFile,
      audioUrl: !!audioUrl,
      diarizedTranscription: diarizedTranscription ? 
        (Array.isArray(diarizedTranscription) ? `Array[${diarizedTranscription.length}]` : typeof diarizedTranscription) 
        : null,
      hasValidTranscription,
      showTranscribeButton,
      showSimpleTranscript,
      loading,
      showAudioUpload,
      existingTranscription,
      showTranscriptionUpload
    });
  }, [audioFile, audioUrl, diarizedTranscription, hasValidTranscription, showTranscribeButton, showSimpleTranscript, loading, showAudioUpload, existingTranscription, showTranscriptionUpload]);
  
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
        setProcessingStep('Loading call data...');
        
        // If we don't have the call data, fetch it
        if (!callData) {
          const fetchedCall = await fetchCallById(callId);
          setCallData(fetchedCall);
        }
        
        // Check for transcription metadata first (indicates a transcription exists in database)
        const transcriptionMetadata = localStorage.getItem(`call_${callId}_transcription_metadata`);
        let hasTranscriptionMetadata = false;
        
        if (transcriptionMetadata) {
          try {
            const metadata = JSON.parse(transcriptionMetadata);
            console.log(`Found transcription metadata for call ${callId}:`, metadata);
            hasTranscriptionMetadata = true;
          } catch (parseError) {
            console.error('Error parsing transcription metadata:', parseError);
          }
        }
        
        // Check for existing transcription content
        setProcessingStep('Loading transcription...');
        const existingTranscript = await fetchTranscription(callId);
        
        if (existingTranscript && Array.isArray(existingTranscript) && existingTranscript.length > 0) {
          setDiarizedTranscription(existingTranscript);
          setExistingTranscription(true);
          
          // Set transcription flag in localStorage
          localStorage.setItem(`transcription_flag_${callId}`, 'true');
          
          setSuccess("Existing transcription loaded successfully");
          setShowSnackbar(true);
          // Don't show upload panels if we have a valid transcription
          setShowTranscriptionUpload(false);
          
          // We'll determine audio status after trying to load it,
          // this is just a flag to remember we have a valid transcription
          const hasValidTranscriptionFlag = true;
        } else if (hasTranscriptionMetadata) {
          // We have metadata indicating a transcription exists, but couldn't load the content
          setDiarizedTranscription([{
            speaker: "Speaker 1",
            text: "This call has been transcribed before. The transcription data will be automatically loaded.",
            start_time: 0,
            end_time: 1
          }]);
          setExistingTranscription(true);
          setSuccess("Transcription record found. Loading transcription data...");
          setShowSnackbar(true);
          setShowTranscriptionUpload(true); // Show upload option since we need the content
        } else {
          // No transcription found
          setDiarizedTranscription(null);
          setExistingTranscription(false);
          setShowTranscriptionUpload(true);
        }
        
        // Check for existing audio file using the enhanced getCallAudio function
        setProcessingStep('Loading audio file...');
        
        // First check sessionStorage for a direct audio URL
        const sessionAudioUrl = sessionStorage.getItem(`audio_url_${callId}`);
        let audioResult;
        
        if (sessionAudioUrl) {
          console.log(`Found audio URL in sessionStorage for call ${callId}`);
          setAudioUrl(sessionAudioUrl);
          setAudioFile(new File(["dummy content"], "audio_file.mp3", { type: 'audio/mpeg' }));
          audioResult = { source: 'sessionStorage', url: sessionAudioUrl, file: true };
        } else {
          // If not in sessionStorage, try other methods
          audioResult = await getCallAudio(callId);
        }
        
        if (audioResult) {
          console.log(`Found audio for call ${callId} from source: ${audioResult.source}`);
          
          if (audioResult.url) {
            setAudioUrl(audioResult.url);
          }
          
          if (audioResult.file) {
            setAudioFile(audioResult.file);
            
            // If we have both audio and transcription, set a more comprehensive success message
            if (existingTranscript && Array.isArray(existingTranscript) && existingTranscript.length > 0) {
              setSuccess(`Call loaded with audio from ${audioResult.source} and existing transcription`);
            } else {
              setSuccess(`Audio file loaded from ${audioResult.source}`);
            }
            
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
        
        // Check if we have a valid transcription but no audio, to show simple transcript view
        if (existingTranscript && Array.isArray(existingTranscript) && existingTranscript.length > 0 && 
            (!audioResult || (!audioResult.url && !audioResult.file))) {
          console.log("Transcription exists without audio - showing simple transcript view");
          setShowSimpleTranscript(true);
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
      
      // If we were in simple transcript mode, switch to full mode with audio
      if (showSimpleTranscript) {
        setShowSimpleTranscript(false);
      }
      
      // Save the audio file to multiple locations
      saveAudioFileMultiple(file);
      
      // Check if there's a transcription flag indicating this call has been transcribed before
      const transcriptionFlag = localStorage.getItem(`transcription_flag_${callId}`);
      const hasTranscriptionFlag = transcriptionFlag === 'true';
      
      // Handle transcription state based on existing data
      if (existingTranscription) {
        // If we have an existing transcription loaded, keep it unless user chooses to replace
        if (hasTranscriptionFlag && window.confirm("A transcription already exists for this call. Do you want to create a new one?")) {
          setTranscription(null);
          setDiarizedTranscription(null);
          setExistingTranscription(false);
          
          // Clear the transcription flag so we don't prompt again
          localStorage.removeItem(`transcription_flag_${callId}`);
          localStorage.removeItem(`transcription_${callId}`);
          
          // Also clear the metadata
          localStorage.removeItem(`call_${callId}_transcription_metadata`);
          
          // Remove from project transcriptions list
          const savedTranscriptions = JSON.parse(localStorage.getItem('projectTranscriptions') || '[]');
          const filteredTranscriptions = savedTranscriptions.filter(record => record.callId !== callId);
          localStorage.setItem('projectTranscriptions', JSON.stringify(filteredTranscriptions));
          
          console.log(`Removed existing transcription data for call ${callId}`);
        }
      }
      
      // Make sure transcription upload panel is not displayed when we have an audio file
      // unless we have a transcription flag but no actual transcription data
      if (hasTranscriptionFlag && !existingTranscription) {
        setShowTranscriptionUpload(true);
      } else {
        setShowTranscriptionUpload(false);
      }
      
      // Make sure audio upload panel is not displayed
      setShowAudioUpload(false);
      
      // Log the state for debugging
      console.log("Audio file set:", {
        filename: file.name,
        size: file.size,
        type: file.type,
        audioUrl: Boolean(url),
        existingTranscription: Boolean(existingTranscription),
        diarizedTranscription: Boolean(diarizedTranscription),
        hasTranscriptionFlag
      });
    }
  };
  
  // Save audio file to multiple locations
  const saveAudioFileMultiple = async (file) => {
    try {
      // Use the callsService to save the audio file
      const result = await saveAudioFile(file, callId);
      
      // Check if we have an existing transcription flag
      const transcriptionFlag = localStorage.getItem(`transcription_flag_${callId}`);
      const hasTranscriptionFlag = transcriptionFlag === 'true';
      
      // Create metadata for the audio file linked to the call
      try {
        // In a real app, you would call an API to update the call record in the database:
        // await fetch('/api/calls/${callId}/audio', { ... })
        
        // For our demo, store in localStorage
        localStorage.setItem(`call_${callId}_audio_metadata`, JSON.stringify({
          has_audio: true,
          filename: file.name,
          type: file.type,
          size: file.size,
          storage_path: result.path || null,
          timestamp: new Date().toISOString(),
          transcribed: hasTranscriptionFlag
        }));
        
        console.log(`Call audio metadata saved for call ${callId}`);
        
        // Store the file itself in localStorage for direct access
        // Convert file to data URL for storage in sessionStorage
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          sessionStorage.setItem(`audio_url_${callId}`, dataUrl);
          console.log(`Audio file saved as data URL in sessionStorage for call ${callId}`);
        };
        reader.readAsDataURL(file);
        console.log(`Audio URL saved to sessionStorage for call ${callId}`);
      } catch (metadataError) {
        console.error('Error saving audio metadata:', metadataError);
      }
      
      if (result.success) {
        if (hasTranscriptionFlag) {
          setSuccess("Audio file saved to project storage. This call already has a transcription.");
        } else {
          setSuccess("Audio file saved to your downloads folder and project storage");
        }
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
          const jsonContent = e.target.result;
          const parsedData = JSON.parse(jsonContent);
          
          // Process transcription data based on format
          let processedData = parsedData;
          
          // If it's in the conversation format, convert it to our expected format
          if (parsedData.conversation && Array.isArray(parsedData.conversation)) {
            console.log("Detected conversation format, converting...");
            processedData = parsedData.conversation.map((item, index) => ({
              speaker: item.speaker || `Speaker ${index % 2 + 1}`,
              text: item.text || "",
              start_time: index,  // Dummy values for compatibility
              end_time: index + 1
            }));
          }
          
          // Always save the original JSON as is
          localStorage.setItem(`transcription_${callId}`, jsonContent);
          
          // Set the processed data to state
          setDiarizedTranscription(processedData);
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
    
    try {
      setLoading(true);
      setError(null);
      
      // Explicitly clear any existing transcription
      setDiarizedTranscription(null);
      setExistingTranscription(false);
      
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
      
      // Set transcription flag in localStorage
      localStorage.setItem(`transcription_flag_${callId}`, 'true');
      
      // Log success info
      console.log('Transcription process completed successfully:', {
        callId,
        audioFilename: audioFile.name,
        transcriptionLength: diarizedResult.length
      });
      
      setSuccess("Transcription created successfully! It has been saved to your downloads folder and project storage.");
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
  
  // Handle download transcript
  const handleDownloadTranscript = () => {
    if (!diarizedTranscription) {
      setError("No transcription available to download");
      setShowSnackbar(true);
      return;
    }
    
    try {
      // Create a JSON string of the transcription data
      const transcriptData = JSON.stringify(diarizedTranscription, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([transcriptData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set download attributes and trigger click
      link.href = url;
      link.download = `transcript_${callId}_${callData?.client || 'call'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess("Transcript downloaded successfully");
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error downloading transcript:', error);
      setError("Failed to download transcript");
      setShowSnackbar(true);
    }
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflow: 'hidden' }}>
        {/* Header with back button and title */}
        {/* Back to Calls button at top left */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/calls')}
            sx={{
              bgcolor: 'var(--primary-color)',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': { 
                bgcolor: 'var(--primary-hover)', 
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              },
              textTransform: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.85rem',
              width: 'auto',
              display: 'inline-flex',
              flexShrink: 0
            }}
          >
            Back to Calls
          </Button>
        </Box>

        {/* Header with title */}
        <Box sx={{ 
          mb: 4, 
          pb: 2, 
          borderBottom: '1px solid #e0e0e0',
          width: '100%'
        }}>
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
          {/* Conditional rendering based on audio and transcription availability */}
          {!audioFile && !showSimpleTranscript ? (
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
              
            </Box>
          ) : showSimpleTranscript ? (
            // Special view for when transcription exists but audio is missing
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Info panel to show transcription found but audio missing */}
              <Box sx={{ 
                p: 3, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderBottom: '1px solid rgba(255, 152, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#e65100' }}>
                    Transcription found in database, but the audio file is missing.
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setProcessingStep('Cleaning transcription format...');
                        
                        // Call the Groq function to clean the transcript
                        const cleanedTranscript = await cleanTranscriptWithGroq(diarizedTranscription);
                        
                        // Update the state with cleaned transcript
                        setDiarizedTranscription(cleanedTranscript);
                        
                        // Save the cleaned transcript
                        await saveTranscription(callId, cleanedTranscript);
                        
                        setSuccess("Transcription cleaned and reformatted successfully");
                        setShowSnackbar(true);
                      } catch (error) {
                        console.error('Error cleaning transcript:', error);
                        setError("Failed to clean transcript format");
                        setShowSnackbar(true);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                    disabled={loading}
                  >
                    Clean Messy Transcript
                  </Button>
                  
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUploadIcon fontSize="small" />}
                    sx={{ 
                      borderColor: '#ff9800',
                      color: '#ff9800',
                      '&:hover': { 
                        borderColor: '#e65100',
                        bgcolor: 'rgba(255, 152, 0, 0.04)'
                      },
                      textTransform: 'none',
                      fontWeight: 500
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
                </Box>
              </Box>
              
              {/* Simple transcript display */}
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
                    Transcript (Simple View)
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="warning"
                      size="large"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          setProcessingStep('Cleaning transcription format...');
                          
                          // Call the Groq function to clean the transcript
                          const cleanedTranscript = await cleanTranscriptWithGroq(diarizedTranscription);
                          
                          // Update the state with cleaned transcript
                          setDiarizedTranscription(cleanedTranscript);
                          
                          // Save the cleaned transcript
                          await saveTranscription(callId, cleanedTranscript);
                          
                          setSuccess("Transcription cleaned and reformatted successfully");
                          setShowSnackbar(true);
                        } catch (error) {
                          console.error('Error cleaning transcript:', error);
                          setError("Failed to clean transcript format");
                          setShowSnackbar(true);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        mr: 1,
                        py: 1.5,
                        px: 2
                      }}
                      disabled={loading}
                    >
                      Clean Format
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadTranscript}
                      sx={{
                        bgcolor: 'var(--primary-color)',
                        fontWeight: 500,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { 
                          bgcolor: 'var(--primary-hover)', 
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        },
                        textTransform: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        width: 'auto',
                        display: 'inline-flex',
                        flexShrink: 0
                      }}
                    >
                      Download
                    </Button>
                    
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
                  </Box>
                </Box>
                
                {/* Simple transcript content */}
                <Box 
                  sx={{
                    p: 4, 
                    height: 'calc(100vh - 280px)', 
                    overflowY: 'auto',
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
                    }
                  }}
                >
                  {getProcessedTranscription().map((segment, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        mb: 4,
                        display: 'flex',
                        width: '100%'
                      }}
                    >
                      <Box 
                        sx={{ 
                          minWidth: '120px', 
                          mr: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep'
                              ? 'var(--primary-color)' 
                              : segment.speaker === 'Speaker 2' || segment.speaker === 'Caller' || segment.speaker === 'Customer' || segment.speaker === 'Client'
                                ? '#E57373' 
                                : index % 2 === 0 ? 'var(--primary-color)' : '#E57373',
                            color: 'white',
                            width: '110px',
                            textAlign: 'center',
                            py: 1,
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            boxShadow: segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep' || index % 2 === 0
                              ? '0 3px 8px rgba(79, 70, 229, 0.25)' 
                              : '0 3px 8px rgba(229, 115, 115, 0.25)',
                            letterSpacing: '0.3px'
                          }}
                        >
                          {segment.speaker}
                        </Box>
                      </Box>
                      
                      <Box
                        sx={{
                          flex: 1,
                          p: 3,
                          borderRadius: '12px',
                          bgcolor: '#f9fafb',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          border: '1px solid rgba(0,0,0,0.05)'
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
                          {segment.text}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : (
            // Main content when file is selected or transcription exists
            <>
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
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* Removed duplicate transcribe button */}
                          
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
                  
                  {/* Show audio upload button if needed */}
                  {showAudioUpload && !audioFile && (
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
              </Box>
              
              {/* FIXED: Add transcribe banner when needed */}
              {showTranscribeButton && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(76, 175, 80, 0.1)', 
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1b5e20' }}>
                    Audio file uploaded successfully. Ready to create a transcription with speaker identification.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleProcessAudio}
                    startIcon={<PlayArrowIcon />}
                    sx={{ 
                      bgcolor: '#4caf50',
                      '&:hover': { bgcolor: '#388e3c' },
                      ml: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Transcribe Now
                  </Button>
                </Box>
              )}

              {/* Transcript content area - show transcription if available, otherwise show a message */}
              {hasValidTranscription ? (
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<AssessmentIcon />}
                          onClick={() => navigate('/dashboard/call-insights', { state: { callData } })}
                          sx={{
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            '&:hover': { 
                              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                            },
                            textTransform: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            flexShrink: 0
                          }}
                        >
                          Generate Insights
                        </Button>
                        
                        <Button
                          variant="outlined"
                          onClick={async () => {
                            try {
                              setLoading(true);
                              setProcessingStep('Cleaning transcription format...');
                              
                              // Call the Groq function to clean the transcript
                              const cleanedTranscript = await cleanTranscriptWithGroq(diarizedTranscription);
                              
                              // Update the state with cleaned transcript
                              setDiarizedTranscription(cleanedTranscript);
                              
                              // Save the cleaned transcript
                              await saveTranscription(callId, cleanedTranscript);
                              
                              setSuccess("Transcription cleaned and reformatted successfully");
                              setShowSnackbar(true);
                            } catch (error) {
                              console.error('Error cleaning transcript:', error);
                              setError("Failed to clean transcript format");
                              setShowSnackbar(true);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          sx={{
                            borderColor: 'var(--primary-color)',
                            color: 'var(--primary-color)',
                            '&:hover': { 
                              borderColor: 'var(--primary-hover)',
                              bgcolor: 'rgba(79, 70, 229, 0.04)'
                            },
                            textTransform: 'none',
                            fontWeight: 500,
                            mr: 1
                          }}
                          disabled={loading}
                        >
                          Clean Format
                        </Button>
                        
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={handleDownloadTranscript}
                          sx={{
                            bgcolor: 'var(--primary-color)',
                            fontWeight: 500,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            '&:hover': { 
                              bgcolor: 'var(--primary-hover)', 
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            },
                            textTransform: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            width: 'auto',
                            display: 'inline-flex',
                            flexShrink: 0
                          }}
                        >
                          Download
                        </Button>
                        
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
                      </Box>
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
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: 'calc(100vh - 380px)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Top gradient overlay - fixed position */}
                      <Box 
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100px',
                          background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.9) 40%, rgba(255,255,255,0))',
                          pointerEvents: 'none',
                          zIndex: 3
                        }}
                      />
                      
                      {/* Bottom gradient overlay - fixed position */}
                      <Box 
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '100px',
                          background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0.9) 40%, rgba(255,255,255,0))',
                          pointerEvents: 'none',
                          zIndex: 3
                        }}
                      />
                      
                      {/* Actual scrollable content */}
                      <Box 
                        ref={transcriptContainerRef}
                        sx={{ 
                          p: 4,
                          height: '100%',
                          overflowY: 'auto',
                          scrollBehavior: 'smooth',
                          paddingBottom: '120px',
                          paddingTop: '120px',
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
                          }
                        }}
                    >
                      {getProcessedTranscription().map((segment, index) => (
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
                                bgcolor: segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep'
                                  ? 'var(--primary-color)' 
                                  : segment.speaker === 'Speaker 2' || segment.speaker === 'Caller' || segment.speaker === 'Customer' || segment.speaker === 'Client'
                                    ? '#E57373' 
                                    : index % 2 === 0 ? 'var(--primary-color)' : '#E57373',
                                color: 'white',
                                width: '110px',
                                textAlign: 'center',
                                py: 1.2,
                                borderRadius: '8px',
                                mb: 1.5,
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                boxShadow: segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep' || index % 2 === 0
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
                                ? (segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep' || index % 2 === 0 
                                  ? 'var(--primary-light)' 
                                  : '#FFEBEE')
                                : '#f9fafb',
                              transition: 'all 0.3s ease',
                              boxShadow: currentTime >= segment.start_time && currentTime <= segment.end_time
                                ? (segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep' || index % 2 === 0
                                  ? '0 4px 12px rgba(79, 70, 229, 0.15)' 
                                  : '0 4px 12px rgba(229, 115, 115, 0.15)')
                                : '0 1px 3px rgba(0,0,0,0.05)',
                              border: '1px solid',
                              borderColor: currentTime >= segment.start_time && currentTime <= segment.end_time
                                ? (segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep' || index % 2 === 0 
                                  ? 'rgba(79, 70, 229, 0.2)' 
                                  : 'rgba(229, 115, 115, 0.2)')
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
                                        ? (segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep' 
                                          ? 'var(--primary-color)' 
                                          : '#E57373') 
                                        : 'transparent',
                                      color: isWordActive(word.start_time, word.end_time) ? 'white' : 'inherit',
                                      padding: isWordActive(word.start_time, word.end_time) ? '3px 6px' : '2px 0',
                                      borderRadius: '4px',
                                      marginRight: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      boxShadow: isWordActive(word.start_time, word.end_time) 
                                        ? (segment.speaker === 'Speaker 1' || segment.speaker === 'Agent' || segment.speaker === 'Sales Rep'
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
                  </Box>
                </Box>
              ) : audioFile && !loading ? (
                // FIXED: Empty state when audio exists but no transcription
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center',
                  bgcolor: '#f9fafb'
                }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '50%',
                      mb: 3
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#2e7d32' }}>
                    Ready for Transcription
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, maxWidth: '600px', color: 'text.secondary' }}>
                    Your audio has been uploaded. Click the Transcribe button to process the audio 
                    and generate a transcript with speaker identification using Groq AI.
                  </Typography>
                </Box>
              ) : (
                // Loading state
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center',
                  bgcolor: '#f9fafb'
                }}>
                  <CircularProgress size={60} sx={{ color: 'var(--primary-color)', mb: 3 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    {processingStep || "Loading..."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please wait while we process your request
                  </Typography>
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