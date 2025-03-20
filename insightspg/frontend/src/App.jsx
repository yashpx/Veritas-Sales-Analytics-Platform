import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [buyerIntent, setBuyerIntent] = useState(null);
  const [callSummary, setCallSummary] = useState(null);
  const [profanityCheck, setProfanityCheck] = useState(null);

  // Fetch the JSON from your Python backend
  useEffect(() => {
    // Get a sample call ID - in production you would get this from the route or props
    const callId = "sample-call-1"; 
    
    // Use the new API endpoint with call ID
    fetch(`http://localhost:5001/api/call-insights/${callId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((formattedData) => {
        console.log('Formatted insights data:', formattedData);
        setData(formattedData);
        
        // Set the parsed data directly from the formatted response
        setCallSummary({
          summary: formattedData.summary,
          rating: formattedData.rating,
          strengths: formattedData.strengths,
          areas_for_improvement: formattedData.areas_for_improvement
        });
        
        setBuyerIntent({ nlp: formattedData.buyer_intent });
        setProfanityCheck({ 
          "severity level": formattedData.profanity_level,
          "report": formattedData.profanity_report || "No profanity detected."
        });
        
        // Create an analysis object for detailed sections
        setAnalysis({
          "Conversational Balance": formattedData.conversational_balance,
          "Objection Handling": formattedData.objection_handling,
          "Pitch Optimization": formattedData.pitch_optimization,
          "Call-to-Action Execution": formattedData.call_to_action
        });
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        // Fallback to the older endpoint if new one fails
        fetch('http://localhost:5001/api/output')
          .then((response) => response.json())
          .then((jsonData) => {
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
              const parsedData = JSON.parse(customRagData.custom_rag_analysis.output);
              setAnalysis(parsedData);
            } catch (err) {
              console.error('Error parsing custom_rag_analysis:', err);
            }

            // Parse profanity check
            try {
              const profanityData = JSON.parse(jsonData.profanity_check.output);
              const parsedProfanity = JSON.parse(profanityData.profanity_check.output);
              setProfanityCheck(parsedProfanity);
            } catch (err) {
              console.error('Error parsing profanity_check:', err);
            }
          });
      });
  }, []);

  // Always call the hook; then check for data inside
  useEffect(() => {
    if (!data) return;

    const toggleAccordion = (header) => {
      // First close all other accordions
      const allHeaders = document.querySelectorAll('.accordion-header');
      allHeaders.forEach(h => {
        if (h !== header && h.classList.contains('active')) {
          h.classList.remove('active');
          const content = h.nextElementSibling;
          if (content) {
            content.classList.remove('show');
          }
        }
      });
      
      // Toggle the current accordion
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

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="top-bar">
        <div className="logo">Call Insights</div>
      </div>

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
                  {Array.isArray(callSummary?.strengths) ? (
                    <ul>
                      {callSummary.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ maxWidth: '100%', wordWrap: 'break-word' }}>
                      {callSummary?.strengths || 'No strengths available'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="analysis-column">
                <h4>Areas for Improvement</h4>
                <div className="bullet-points">
                  {Array.isArray(callSummary?.areas_for_improvement) ? (
                    <ul>
                      {callSummary.areas_for_improvement.map((area, index) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ maxWidth: '100%', wordWrap: 'break-word' }}>
                      {callSummary?.areas_for_improvement || 'No improvements available'}
                    </p>
                  )}
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
                      <p style={{ maxWidth: '100%', wordWrap: 'break-word' }}>{value}</p>
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
    </div>
  );
}

export default App;