// server.js
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 5001;

// Enable JSON body parsing
app.use(express.json());

// Enable CORS so your React app can access this API
app.use(cors());

// Initialize Supabase client with environment variables or default values
const supabaseUrl = process.env.SUPABASE_URL || 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to convert plain text transcription to insights.py compatible format
const convertTranscriptionToInsightsFormat = (transcription) => {
  // Split by double newlines which separate speakers in the stored format
  const lines = transcription.split('\n\n');
  
  // Create diarized segments
  const diarizedTranscript = lines.map((line, index) => {
    // Extract speaker and text using regex
    const match = line.match(/^(Speaker \d+):\s(.+)$/s);
    
    if (match) {
      return {
        speaker: match[1],
        text: match[2],
        start: index * 5, // Approximate timestamps
        end: (index + 1) * 5
      };
    } else {
      // Fallback if pattern doesn't match
      return {
        speaker: "Speaker 1",
        text: line,
        start: index * 5,
        end: (index + 1) * 5
      };
    }
  });
  
  return { transcript: diarizedTranscript };
};

// Function to format insights.py output for frontend display
const formatInsightsForStorage = (insightsData) => {
  try {
    console.log('Formatting insights data from insights.py...');
    
    // Extract call summary data
    const callSummary = JSON.parse(insightsData.call_summary.output || '{}');
    
    // Handle potentially double-nested JSON in custom_rag_analysis
    let ragAnalysis = {};
    try {
      const ragData = JSON.parse(insightsData.custom_rag_analysis.output || '{}');
      // Check if there's a nested 'output' field
      if (ragData.custom_rag_analysis && ragData.custom_rag_analysis.output) {
        ragAnalysis = JSON.parse(ragData.custom_rag_analysis.output);
      } else {
        ragAnalysis = ragData;
      }
    } catch (ragError) {
      console.error('Error parsing RAG analysis:', ragError);
    }
    
    // Extract buyer intent
    const buyerIntent = JSON.parse(insightsData.buyer_intent.output || '{}');
    
    // Handle potentially double-nested JSON in profanity_check
    let profanityCheck = {};
    try {
      const profanityData = JSON.parse(insightsData.profanity_check.output || '{}');
      // Check if there's a nested 'output' field
      if (profanityData.profanity_check && profanityData.profanity_check.output) {
        profanityCheck = JSON.parse(profanityData.profanity_check.output);
      } else {
        profanityCheck = profanityData;
      }
    } catch (profanityError) {
      console.error('Error parsing profanity check:', profanityError);
    }
    
    // Extract topics from the summary and analysis
    const topics = extractTopics(callSummary.summary, ragAnalysis);
    
    // Format data for frontend
    const formattedData = {
      summary: callSummary.summary || 'No summary available',
      rating: callSummary.rating || 0,
      strengths: callSummary.strengths ? callSummary.strengths.split('\n• ').filter(s => s) : [],
      areas_for_improvement: callSummary.areas_for_improvement ? callSummary.areas_for_improvement.split('\n• ').filter(s => s) : [],
      buyer_intent: buyerIntent.nlp || 'Neutral',
      profanity_level: profanityCheck["severity level"] || 'Clean',
      topics: topics,
      raw_insights: insightsData // Store the full raw data
    };
    
    // Add RAG analysis fields if available
    if (ragAnalysis['Conversational Balance']) {
      formattedData.conversational_balance = ragAnalysis['Conversational Balance'];
    }
    
    if (ragAnalysis['Objection Handling']) {
      formattedData.objection_handling = ragAnalysis['Objection Handling'];
    }
    
    if (ragAnalysis['Pitch Optimization']) {
      formattedData.pitch_optimization = ragAnalysis['Pitch Optimization'];
    }
    
    if (ragAnalysis['Call-to-Action Execution']) {
      formattedData.call_to_action = ragAnalysis['Call-to-Action Execution'];
    }
    
    console.log('Successfully formatted insights data');
    return formattedData;
  } catch (error) {
    console.error('Error formatting insights data:', error);
    return {
      summary: 'Error processing insights',
      rating: 0,
      strengths: [],
      areas_for_improvement: [],
      buyer_intent: 'Neutral',
      profanity_level: 'Clean',
      topics: [],
      raw_insights: insightsData || {}
    };
  }
};

// Helper function to extract topics from the analysis
const extractTopics = (summary, ragAnalysis) => {
  try {
    // This is a simplified approach - in production, you might use 
    // a more sophisticated topic extraction algorithm
    const combinedText = `${summary || ''} ${Object.values(ragAnalysis || {}).join(' ')}`;
    const commonBusinessTopics = [
      'Pricing', 'Features', 'Benefits', 'Implementation', 
      'Timeline', 'Support', 'Training', 'Integration',
      'Security', 'Compliance', 'ROI', 'Cost Savings',
      'Efficiency', 'Productivity', 'Scaling', 'Performance'
    ];
    
    return commonBusinessTopics.filter(topic => 
      combinedText.toLowerCase().includes(topic.toLowerCase())
    ).slice(0, 5); // Limit to 5 topics
  } catch (error) {
    console.error('Error extracting topics:', error);
    return [];
  }
};

// Original endpoint for general insights
app.get('/api/output', (req, res) => {
  // Execute the Python script with the correct working directory
  const scriptPath = path.join(__dirname, 'insights.py');
  exec('python3 ' + scriptPath, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing insights.py:', error);
      console.error('Stderr:', stderr);
      return res.status(500).json({ error: 'Failed to run Python script', details: error.message });
    }
    
    if (stderr) {
      console.warn('Python script warnings:', stderr);
    }
    
    console.log('Python script output:', stdout);
    
    try {
      // Parse the Python script output to JSON
      const data = JSON.parse(stdout);
      res.json(data);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Raw output:', stdout);
      res.status(500).json({ error: 'Invalid JSON output from Python script', details: parseError.message, raw: stdout });
    }
  });
});

// New endpoint for processing call insights from Supabase
app.post('/api/call-insights/:callId', async (req, res) => {
  try {
    const callId = req.params.callId;
    console.log(`Processing insights for call ID: ${callId}`);
    
    // 1. Fetch transcription from Supabase
    const { data: call, error } = await supabase
      .from('call_logs')
      .select('transcription')
      .eq('call_id', callId)
      .single();
    
    if (error) {
      console.error('Error fetching call from Supabase:', error);
      return res.status(500).json({ error: 'Failed to fetch call data', details: error.message });
    }
    
    if (!call || !call.transcription) {
      return res.status(404).json({ error: 'No transcription found for this call' });
    }
    
    // 2. Convert to insights.py format
    const transcriptionData = convertTranscriptionToInsightsFormat(call.transcription);
    const diarizedTranscriptPath = path.join(__dirname, 'diarized-transcript.json');
    
    // 3. Save to diarized-transcript.json
    fs.writeFileSync(
      diarizedTranscriptPath,
      JSON.stringify(transcriptionData, null, 2)
    );
    
    console.log(`Saved diarized transcript to ${diarizedTranscriptPath}`);
    
    // 4. Execute insights.py
    const scriptPath = path.join(__dirname, 'insights.py');
    exec('python3 ' + scriptPath, (execError, stdout, stderr) => {
      if (execError) {
        console.error('Error executing insights.py:', execError);
        console.error('Stderr:', stderr);
        return res.status(500).json({ error: 'Failed to analyze transcription', details: execError.message });
      }
      
      if (stderr) {
        console.warn('Python script warnings:', stderr);
      }
      
      console.log('Python script output length:', stdout.length);
      
      try {
        // 5. Parse the results
        const insightsData = JSON.parse(stdout);
        
        // 6. Format insights for storage
        const formattedInsights = formatInsightsForStorage(insightsData);
        
        // 7. Return insights without trying to save to database (we'll fix the database issue separately)
        console.log(`Returning insights for call ID: ${callId} without saving to database`);
        res.json(formattedInsights);
      } catch (parseError) {
        console.error('Error parsing insights output:', parseError);
        console.error('Raw output:', stdout.substring(0, 1000) + '...');
        res.status(500).json({ error: 'Invalid output from insights.py', details: parseError.message });
      }
    });
  } catch (error) {
    console.error('Error processing call insights:', error);
    res.status(500).json({ error: 'Failed to process call insights', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});