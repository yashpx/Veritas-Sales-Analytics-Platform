import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { 
  Box, Paper, Typography, CircularProgress, Alert,
  Card, CardContent, Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchCallInsights } from '../utils/insightsService';
import '../styles/dashboard.css';

const CallInsights = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [processing, setProcessing] = useState(false);
  const callData = location.state?.callData;

  useEffect(() => {
    const loadInsights = async () => {
      if (!callData) {
        setError("No call data provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Call data:", callData);
        
        // Use callData.id instead of callData.call_id
        const callId = callData.id;
        if (!callId) {
          throw new Error("No call ID found in call data");
        }
        console.log(`Using call ID: ${callId}`);
        
        // Fetch insights for the call
        setProcessing(true);
        const insightsData = await fetchCallInsights(callId);
        setInsights(insightsData);
        setProcessing(false);
        setLoading(false);
      } catch (err) {
        console.error("Error loading insights:", err);
        setError(err.message || "Failed to load insights");
        setLoading(false);
        setProcessing(false);
      }
    };

    loadInsights();
  }, [callData]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If no call data was provided, redirect back to calls page
  if (!callData) {
    return <Navigate to="/dashboard/calls" />;
  }

  const renderInsightSection = (title, content) => {
    if (!content) return null;
    
    return (
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#8a2be2', mb: 2 }}>
            {title}
          </Typography>
          <Typography variant="body1" component="div">
            {typeof content === 'string' ? (
              content
            ) : Array.isArray(content) ? (
              <ul style={{ paddingLeft: '20px' }}>
                {content.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              JSON.stringify(content)
            )}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => window.history.back()}
              sx={{ mr: 2, color: '#8a2be2' }}
            >
              Back to Calls
            </Button>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
              Call Insights
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Call Details
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Client</Typography>
              <Typography variant="body1" fontWeight="medium">{callData.client}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Sales Rep</Typography>
              <Typography variant="body1" fontWeight="medium">{callData.salesRep}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="body1" fontWeight="medium">
                {new Date(callData.date).toLocaleDateString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography variant="body1" fontWeight="medium">{callData.duration}m</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Outcome</Typography>
              <Typography variant="body1" fontWeight="medium">
                <span className={`status-badge ${callData.outcome.toLowerCase()}`}>
                  {callData.outcome}
                </span>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={40} sx={{ color: '#8a2be2', mr: 2 }} />
            <Typography variant="h6">Loading insights...</Typography>
          </Box>
        ) : processing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={40} sx={{ color: '#8a2be2', mr: 2 }} />
            <Typography variant="h6">Processing insights...</Typography>
          </Box>
        ) : insights ? (
          <Box>
            {renderInsightSection('Summary', insights.summary)}
            {renderInsightSection('Key Points', insights.key_points)}
            {renderInsightSection('Action Items', insights.action_items)}
            {renderInsightSection('Sentiment Analysis', insights.sentiment)}
            
            {insights.topics && (
              <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#8a2be2', mb: 2 }}>
                    Topics Discussed
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {insights.topics.map((topic, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          bgcolor: 'rgba(138, 43, 226, 0.1)', 
                          color: '#8a2be2',
                          borderRadius: 4,
                          px: 2,
                          py: 0.5,
                          fontSize: '0.875rem',
                          fontWeight: 'medium'
                        }}
                      >
                        {topic}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {insights.raw_insights && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Raw Insights Data
                </Typography>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5', overflowX: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                    {JSON.stringify(insights.raw_insights, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            No insights available for this call.
          </Alert>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default CallInsights;
