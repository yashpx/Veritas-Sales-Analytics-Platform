import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, CircularProgress, Alert, Snackbar,
  Card, CardContent, Button, Chip, Divider, Grid, Rating
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchCallInsights } from '../utils/insightsService';

const CallInsights = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [insights, setInsights] = useState(null);
  const callData = location.state?.callData;

  useEffect(() => {
    const loadInsights = async () => {
      if (!callData) {
        setError("No call data provided. Please return to the calls page and select a call.");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch insights for the call
        const insightsData = await fetchCallInsights(callData.id);
        setInsights(insightsData);
        
        // Set a flag in localStorage to indicate insights exist
        localStorage.setItem(`insights_flag_${callData.id}`, 'true');
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading insights:", err);
        setError(err.message || "Failed to load insights");
        setOpenSnackbar(true);
        setLoading(false);
      }
    };

    loadInsights();
  }, [callData]);

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderSectionCard = (title, content, icon, color = 'var(--primary-color)') => {
    if (!content) return null;
    
    return (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 2, 
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)',
        overflow: 'visible',
        position: 'relative',
        pt: 4
      }}>
        <Box sx={{ 
          position: 'absolute', 
          top: -20, 
          left: 20, 
          bgcolor: color,
          color: 'white',
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 10px ${color}50`
        }}>
          {icon}
        </Box>
        <CardContent sx={{ pt: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: color, mb: 2 }}>
            {title}
          </Typography>
          <Typography variant="body1" component="div">
            {typeof content === 'string' ? (
              <div style={{ maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{content}</div>
            ) : Array.isArray(content) ? (
              <ul style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: '8px', maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {content.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item}</li>
                ))}
              </ul>
            ) : (
              <div style={{ maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{JSON.stringify(content)}</div>
            )}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word' }}>
        {/* Header with back button and title */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
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
            Back to Transcript
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
              Call Insights
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
            <Chip 
              icon={<AssessmentIcon />}
              label="AI Insights" 
              color="primary"
              size="small"
            />
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={50} sx={{ mb: 3, color: 'var(--primary-color)' }} />
            <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              Analyzing call transcript...
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', maxWidth: 400, textAlign: 'center' }}>
              Our AI is analyzing the call transcript to generate insights. This may take a moment.
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : insights ? (
          <Box>
            {/* Rating and Summary Card */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 2, 
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)',
                mb: 4 
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 2,
                    borderRight: { xs: 'none', md: '1px solid #e0e0e0' }
                  }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: 'text.secondary' }}>
                      Call Rating
                    </Typography>
                    <Box sx={{ 
                      position: 'relative', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 120,
                      height: 120
                    }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={insights.rating || 0} 
                        size={120}
                        thickness={5}
                        sx={{ 
                          color: insights.rating > 75 ? '#4caf50' : 
                                insights.rating > 50 ? '#ff9800' : '#f44336',
                        }}
                      />
                      <Typography 
                        variant="h4" 
                        component="div" 
                        sx={{ 
                          position: 'absolute',
                          fontWeight: 'bold',
                          color: insights.rating > 75 ? '#4caf50' : 
                                 insights.rating > 50 ? '#ff9800' : '#f44336',
                        }}
                      >
                        {insights.rating || 0}%
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Chip 
                        label={insights.buyer_intent || 'Neutral'} 
                        color={
                          (insights.buyer_intent === 'Very Interested' || insights.buyer_intent === 'Interested') ? 'success' :
                          insights.buyer_intent === 'Neutral' ? 'primary' :
                          insights.buyer_intent === 'Not Interested' ? 'error' : 'warning'
                        }
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Buyer Intent
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
                      Call Summary
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {insights.summary || "No summary available"}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
                      Topics Discussed
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {insights.topics && insights.topics.map((topic, index) => (
                        <Chip 
                          key={index}
                          label={topic} 
                          sx={{ 
                            bgcolor: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            fontWeight: 500,
                            '&:hover': { bgcolor: 'var(--primary-light)' }
                          }}
                        />
                      ))}
                      {(!insights.topics || insights.topics.length === 0) && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          No topics available
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Strengths and Areas for Improvement */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderSectionCard(
                  'Strengths', 
                  insights.strengths || [], 
                  <CheckCircleIcon />,
                  '#4caf50'
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderSectionCard(
                  'Areas for Improvement', 
                  insights.areas_for_improvement || [], 
                  <AssessmentIcon />,
                  '#ff9800'
                )}
              </Grid>
            </Grid>
            
            {/* Advanced Call Analysis Sections */}
            {(insights.conversational_balance || 
              insights.objection_handling || 
              insights.pitch_optimization || 
              insights.call_to_action) && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: 'text.primary' }}>
                  Advanced Call Analysis
                </Typography>
                <Grid container spacing={3}>
                  {insights.conversational_balance && (
                    <Grid item xs={12} md={6}>
                      {renderSectionCard(
                        'Conversational Balance', 
                        insights.conversational_balance, 
                        <AssessmentIcon />,
                        '#2196f3'
                      )}
                    </Grid>
                  )}
                  {insights.objection_handling && (
                    <Grid item xs={12} md={6}>
                      {renderSectionCard(
                        'Objection Handling', 
                        insights.objection_handling, 
                        <AssessmentIcon />,
                        '#9c27b0'
                      )}
                    </Grid>
                  )}
                  {insights.pitch_optimization && (
                    <Grid item xs={12} md={6}>
                      {renderSectionCard(
                        'Pitch Optimization', 
                        insights.pitch_optimization, 
                        <AssessmentIcon />,
                        '#3f51b5'
                      )}
                    </Grid>
                  )}
                  {insights.call_to_action && (
                    <Grid item xs={12} md={6}>
                      {renderSectionCard(
                        'Call-to-Action Execution', 
                        insights.call_to_action, 
                        <AssessmentIcon />,
                        '#009688'
                      )}
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
            
            {/* Profanity Check Section */}
            {insights.profanity_level && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: 'text.primary' }}>
                  Content Safety Analysis
                </Typography>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Language Analysis
                    </Typography>
                    <Chip 
                      label={insights.profanity_level}
                      color={
                        insights.profanity_level.includes('Clean') ? 'success' :
                        insights.profanity_level.includes('Mild') ? 'warning' :
                        insights.profanity_level.includes('Moderate') ? 'warning' : 'error'
                      }
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Paper>
              </Box>
            )}
            
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            No insights available for this call.
          </Alert>
        )}

        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="error" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
};

export default CallInsights;