// server.js
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5001;

// Enable CORS so your React app can access this API
app.use(cors());

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});