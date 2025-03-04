import React, { useState, useEffect } from 'react';
import './App.css';
import { FaArrowRight, FaExclamationCircle, FaStar, FaCheckCircle, FaFileAlt } from 'react-icons/fa';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcriptFiles, setTranscriptFiles] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

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

  if (loading && !analysisData) {
    return <div className="content"><div className="section-card">Loading analysis...</div></div>;
  }

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="content">
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
      
      <div className="section-card">
        <div className="card-header">
          <h1>Post-Call Analysis</h1>
          <div className="call-info">
            <div className="call-info-item">
              <span className="call-info-label">Date</span>
              <span className="call-info-value">{formatDate()}</span>
            </div>
            <div className="call-info-item">
              <span className="call-info-label">Duration</span>
              <span className="call-info-value">1 minute</span>
            </div>
            <div className="call-info-item">
              <span className="call-info-label">Rep</span>
              <span className="call-info-value">John Smith</span>
            </div>
            <div className="call-info-item">
              <span className="call-info-label">Prospect</span>
              <span className="call-info-value">Sarah Johnson</span>
            </div>
          </div>
          <button className="transcript-toggle" onClick={toggleTranscriptView}>
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
        </div>

        {showTranscript && (
          <div className="transcript-container">
            <h3>Call Transcript</h3>
            <div className="transcript-content">
              {formatTranscriptText()}
            </div>
          </div>
        )}

        {error ? (
          <div className="error-message">Error: {error}</div>
        ) : (
          <div className="sections-container">
            <div className="sections-row">
              <div className="section">
                <h2 className="section-heading">
                  <span className="section-icon"><FaArrowRight /></span>
                  Recommended Next Step
                </h2>
                <div className="section-content">
                  <strong>{analysisData?.nextStep?.action}</strong>
                  {analysisData?.nextStep?.details && <span>: {analysisData.nextStep.details}</span>}
                  {analysisData?.nextStep?.timing && <div><strong>When:</strong> {analysisData.nextStep.timing}</div>}
                  {analysisData?.nextStep?.additionalInfo && <div><em>{analysisData.nextStep.additionalInfo}</em></div>}
                </div>
              </div>

              <div className="section">
                <h2 className="section-heading">
                  <span className="section-icon"><FaExclamationCircle /></span>
                  Key Objection Identified
                </h2>
                <div className="section-content">
                  <strong>{analysisData?.keyObjection?.issue}</strong>
                  {analysisData?.keyObjection?.context && <span>: {analysisData.keyObjection.context}</span>}
                </div>
              </div>
            </div>

            <div className="sections-row">
              <div className="section">
                <h2 className="section-heading">
                  <span className="section-icon"><FaStar /></span>
                  Key Turning Point
                </h2>
                <div className="section-content">
                  <strong>{analysisData?.keyTurningPoint?.action}</strong>
                  {analysisData?.keyTurningPoint?.context && <span>: {analysisData.keyTurningPoint.context}</span>}
                </div>
              </div>

              <div className="section">
                <h2 className="section-heading">
                  <span className="section-icon"><FaCheckCircle /></span>
                  Outcome
                </h2>
                <div className="section-content">
                  <strong>{analysisData?.outcome?.status}</strong>
                  {analysisData?.outcome?.type && <span>: {analysisData.outcome.type}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
