import React, { useState, useEffect } from 'react';
import './App.css';
import { FaArrowRight, FaExclamationCircle, FaStar, FaCheckCircle, FaFileAlt, FaEye } from 'react-icons/fa';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcriptFiles, setTranscriptFiles] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [callLogId, setCallLogId] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    fetchTranscriptFiles();
  }, []);

  const fetchTranscriptFiles = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/transcripts');
      if (!response.ok) {
        throw new Error('Failed to fetch transcript files');
      }
      const data = await response.json();
      setTranscriptFiles(data);
      
      // If there are transcript files, select the first one by default
      if (data.length > 0) {
        setSelectedTranscript(data[0]);
        fetchTranscriptContent(data[0].id);
      }
    } catch (err) {
      setError('Failed to load transcript files: ' + err.message);
      setLoading(false);
    }
  };

  const fetchTranscriptContent = async (transcriptId) => {
    try {
      const response = await fetch(`http://localhost:5002/api/transcripts/${transcriptId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript content');
      }
      const data = await response.json();
      setTranscriptContent(data);
      
      // Automatically analyze the transcript
      fetchAnalysis(transcriptId);
    } catch (err) {
      setError('Failed to load transcript content: ' + err.message);
      setLoading(false);
    }
  };

  const fetchAnalysis = async (transcriptId) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5002/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_id: transcriptId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      
      const data = await response.json();
      setAnalysisData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptSelect = (transcript) => {
    setSelectedTranscript(transcript);
    fetchTranscriptContent(transcript.id);
  };

  const toggleTranscriptView = () => {
    setShowTranscript(!showTranscript);
  };

  const formatTranscriptText = () => {
    if (!transcriptContent || !transcriptContent.transcript) {
      return 'No transcript content available';
    }
    
    return transcriptContent.transcript.map((item, index) => (
      <div key={index} className="transcript-line">
        <strong>{item.speaker}:</strong> {item.text}
      </div>
    ));
  };

  const handleCallLogIdChange = (e) => {
    setCallLogId(e.target.value);
  };

  const fetchCallInsights = async () => {
    if (!callLogId) {
      setError('Please enter a Call Log ID');
      return;
    }

    try {
      setInsightsLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5002/api/call-insights/${callLogId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch insights');
      }
      
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setInsightsLoading(false);
    }
  };

  const processCallInsights = async () => {
    if (!callLogId) {
      setError('Please enter a Call Log ID');
      return;
    }

    try {
      setInsightsLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5002/api/process-insights/${callLogId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process insights');
      }
      
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="section-card">
        <div className="card-header">
          <h1>Call Analysis Dashboard</h1>
        </div>
        
        <div className="input-group">
          <label htmlFor="callLogId">Call Log ID:</label>
          <input 
            type="text" 
            id="callLogId" 
            value={callLogId} 
            onChange={(e) => setCallLogId(e.target.value)} 
            placeholder="Enter call log ID"
          />
          <button onClick={fetchCallInsights} disabled={insightsLoading}>
            {insightsLoading ? 'Loading...' : 'Fetch Insights'}
          </button>
          <button onClick={processCallInsights} disabled={insightsLoading}>
            {insightsLoading ? 'Processing...' : 'Process Insights'}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <FaExclamationCircle /> {error}
          </div>
        )}
        
        <div className="transcript-selector">
          <h3>Select Transcript</h3>
          <div className="transcript-files">
            {transcriptFiles.map((transcript) => (
              <div 
                key={transcript.id} 
                className={`transcript-file ${selectedTranscript && selectedTranscript.id === transcript.id ? 'selected' : ''}`}
                onClick={() => handleTranscriptSelect(transcript)}
              >
                <FaFileAlt /> {transcript.name}
              </div>
            ))}
          </div>
        </div>
        
        {selectedTranscript && (
          <div className="transcript-header">
            <h2>Selected Transcript: {selectedTranscript.name}</h2>
            <button className="view-transcript-button" onClick={toggleTranscriptView}>
              {showTranscript ? 'Hide Transcript' : 'View Transcript'} <FaEye />
            </button>
          </div>
        )}
        
        {showTranscript && (
          <div className="transcript-container">
            {formatTranscriptText()}
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading analysis...</div>
        ) : (
          analysisData && (
            <div className="sections-container">
              {/* Call Summary Section */}
              {analysisData?.call_summary && (
                <div className="analysis-section">
                  <h2>Call Summary</h2>
                  <div className="summary-content">
                    <p>{analysisData.call_summary.summary}</p>
                    
                    <div className="rating-container">
                      <span className="rating-label">Call Rating:</span>
                      <div className="rating-value">
                        <span>{analysisData.call_summary.rating}/100</span>
                        <div className="rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={i < Math.round(analysisData.call_summary.rating / 20) ? 'filled' : 'empty'} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="strengths-improvements">
                    <div className="strengths">
                      <h3>Strengths</h3>
                      <ul>
                        {analysisData.call_summary.strengths.map((strength, index) => (
                          <li key={index}>
                            <FaCheckCircle className="icon-success" /> {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="improvements">
                      <h3>Areas for Improvement</h3>
                      <ul>
                        {analysisData.call_summary.areas_for_improvement.map((area, index) => (
                          <li key={index}>
                            <FaArrowRight className="icon-improvement" /> {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Custom RAG Analysis Section */}
              {analysisData?.custom_rag_analysis && (
                <div className="analysis-section">
                  <h2>Detailed Analysis</h2>
                  
                  {Object.entries(analysisData.custom_rag_analysis).map(([key, value]) => (
                    <div key={key} className="analysis-item">
                      <h3>{key.replace(/_/g, ' ')}</h3>
                      <p>{value}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Buyer Intent Section */}
              {analysisData?.buyer_intent && (
                <div className="analysis-section">
                  <h2>Buyer Intent</h2>
                  <div className="buyer-intent">
                    <span className={`intent-badge ${analysisData.buyer_intent.nlp.toLowerCase().replace(' ', '-')}`}>
                      {analysisData.buyer_intent.nlp}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Profanity Check Section */}
              {analysisData?.profanity_check && (
                <div className="analysis-section">
                  <h2>Profanity Check</h2>
                  <div className="profanity-check">
                    <div className="severity">
                      <span className="severity-label">Severity:</span>
                      <span className="severity-value">{analysisData.profanity_check.severity_level}</span>
                    </div>
                    <p>{analysisData.profanity_check.report}</p>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;
