import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [buyerIntent, setBuyerIntent] = useState(null);
  const [callSummary, setCallSummary] = useState(null);
  const [profanityCheck, setProfanityCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [callLogId, setCallLogId] = useState('');
  const [error, setError] = useState(null);

  // Function to fetch insights for a specific call log ID
  const fetchInsights = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5001/api/output?callLogId=${id}`);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const jsonData = await response.json();
      processData(jsonData);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to process insights for a call log that doesn't have them yet
  const processNewInsights = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/process-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callLogId: id }),
      });
      
      if (!response.ok) {
        throw new Error(`Error processing insights: ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      processData(jsonData);
    } catch (err) {
      console.error('Error processing new insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process the data returned from the API
  const processData = (jsonData) => {
    setData(jsonData);
    
    // Parse call summary
    try {
      const summary = JSON.parse(jsonData.call_summary.output);
      console.log('Parsed call summary:', summary); // Debug log
      setCallSummary(summary);
    } catch (err) {
      console.error('Error parsing call_summary:', err);
    }

    // Parse buyer intent
    try {
      const buyerIntentData = JSON.parse(jsonData.buyer_intent.output);
      console.log('Raw buyer intent:', buyerIntentData); // Debug log
      setBuyerIntent(buyerIntentData);
    } catch (err) {
      console.error('Error parsing buyer_intent:', err);
    }

    // Parse custom RAG analysis
    try {
      const customRagData = JSON.parse(jsonData.custom_rag_analysis.output);
      console.log('Parsed custom RAG analysis:', customRagData); // Debug log
      
      // Check if the output is nested or direct
      if (customRagData.custom_rag_analysis && customRagData.custom_rag_analysis.output) {
        // Handle nested structure
        try {
          const nestedData = JSON.parse(customRagData.custom_rag_analysis.output);
          setAnalysis(nestedData);
        } catch (nestedErr) {
          console.error('Error parsing nested custom_rag_analysis:', nestedErr);
          setAnalysis(customRagData.custom_rag_analysis);
        }
      } else {
        // Direct structure
        setAnalysis(customRagData);
      }
    } catch (err) {
      console.error('Error parsing custom_rag_analysis:', err);
    }

    // Parse profanity check
    try {
      const profanityData = JSON.parse(jsonData.profanity_check.output);
      console.log('Parsed profanity check:', profanityData); // Debug log
      
      // Handle the nested structure if it exists
      if (profanityData.profanity_check && profanityData.profanity_check.output) {
        try {
          const parsedProfanity = JSON.parse(profanityData.profanity_check.output);
          setProfanityCheck(parsedProfanity);
        } catch (nestedErr) {
          console.error('Error parsing nested profanity_check:', nestedErr);
          setProfanityCheck(profanityData.profanity_check);
        }
      } else {
        setProfanityCheck(profanityData);
      }
    } catch (err) {
      console.error('Error parsing profanity_check:', err);
    }
  };

  // Fetch the default data on initial load
  useEffect(() => {
    fetchInsights('76569'); // Default call log ID
  }, []);

  // Always call the hook; then check for data inside
  useEffect(() => {
    if (!data) return;

    const toggleAccordion = (header) => {
      header.classList.toggle('active');
      const content = header.nextElementSibling;
      if (content) {
        content.classList.toggle('show');
      }
    };

    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach((header) => {
      const handler = () => toggleAccordion(header);
      header.addEventListener('click', handler);
      header._toggleHandler = handler;
    });

    return () => {
      accordionHeaders.forEach((header) => {
        if (header._toggleHandler) {
          header.removeEventListener('click', header._toggleHandler);
        }
      });
    };
  }, [data]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (callLogId) {
      processNewInsights(callLogId);
    }
  };

  if (loading) {
    return <div className="loading">Processing insights... Please wait.</div>;
  }

  return (
    <div className="container">
      <div className="top-bar">
        <div className="logo">Call Insights</div>
        <div className="call-selector">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={callLogId}
              onChange={(e) => setCallLogId(e.target.value)}
              placeholder="Enter Call Log ID"
            />
            <button type="submit">Process Insights</button>
          </form>
        </div>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {!data ? (
        <div>Loading...</div>
      ) : (
        <div className="content">
          <div className="sidebar">
            <h2>Call Rating</h2>
            <div 
              className="match-rate-circle" 
              style={{
                background: `radial-gradient(white 55%, transparent 56%),
                           conic-gradient(var(--circle-color) ${callSummary?.rating || 0}%, #edf1f4 0deg)`
              }}
              data-percentage={callSummary?.rating || 0}
            >
              <div className="number">{callSummary?.rating || 0}%</div>
            </div>

            <div className="sidebar-section">
              <h4>Buyer Intent</h4>
              <p>
                <strong>Predicted:</strong>{' '}
                <span style={{ color: 'green' }}>{buyerIntent?.nlp || 'N/A'}</span>
              </p>
            </div>

            <div className="sidebar-section">
              <h4>Profanity Detection</h4>
              <p>
                <strong>Severity Level:</strong> {profanityCheck?.['severity level'] || 'N/A'}
              </p>
              <p>{profanityCheck?.report || 'N/A'}</p>
            </div>
          </div>

          <div className="main-section">
            <div className="section-card">
              <h3>Call Summary</h3>
              <p>{callSummary?.summary || 'No summary available'}</p>
              
              <div className="analysis-grid">
                <div className="analysis-column">
                  <h4>Strengths</h4>
                  <div className="bullet-points">
                    <p>{callSummary?.strengths || 'No strengths available'}</p>
                  </div>
                </div>
                
                <div className="analysis-column">
                  <h4>Areas for Improvement</h4>
                  <div className="bullet-points">
                    <p>{callSummary?.areas_for_improvement || 'No improvements available'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3>Detailed Analysis</h3>
              <div className="accordion">
                {analysis && Object.entries(analysis)
                  .filter(([key]) => !['Strengths', 'Areas for Improvement'].includes(key))
                  .map(([key, value]) => (
                    <div className="accordion-item" key={key}>
                      <div className="accordion-header">{key}</div>
                      <div className="accordion-content">
                        <p>{value}</p>
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button className="action-button primary" onClick={() => console.log('Generate Follow-Up')}>
                Generate Follow-Up Email
              </button>
              <button className="action-button primary" onClick={() => console.log('Schedule Call')}>
                Schedule Next Call
              </button>
              <button className="action-button secondary" onClick={() => console.log('View Transcript')}>
                View Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;