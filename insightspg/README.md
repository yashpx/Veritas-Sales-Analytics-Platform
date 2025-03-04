# Sales Call Analysis Platform

## System Architecture

The application consists of several Python modules that work together to analyze sales call transcripts:

### Backend Components

1. `insights.py` - Main Flask Server
   - Acts as the central coordinator for all analysis components
   - Provides the `/api/output` endpoint that returns combined analysis
   - Orchestrates the execution of all other analysis modules
   - Handles CORS and API responses

2. `call_summary.py` - Call Analysis
   - Generates concise summaries of sales calls
   - Uses Groq AI to analyze transcripts
   - Provides call rating percentages
   - Identifies key strengths and areas for improvement

3. `custom_rag.py` - Custom Retrieval Analysis
   - Performs detailed analysis of specific sections
   - Extracts relevant information using RAG techniques
   - Provides context-aware insights

4. `buyer_intent.py` - Buyer Intent Analysis
   - Analyzes buyer's purchasing signals
   - Identifies potential objections
   - Evaluates engagement level

5. `detect_profanity.py` - Content Moderation
   - Scans transcripts for inappropriate content
   - Provides content safety metrics

When `insights.py` receives a request:
1. It executes each analysis module sequentially
2. Combines their outputs into a single JSON response
3. Sends the comprehensive analysis back to the frontend

## Setup & Running

### Backend Setup
1. Make sure you have Python 3.8+ installed
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your environment variables in `.env`:
   - `GROQ_API_KEY`: Your Groq API key

### Frontend Setup
1. Make sure you have Node.js installed
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the Flask backend server:
   ```bash
   # From the root directory (insightspg)
   python insights.py
   ```
   The backend will run on http://localhost:5001

2. In a separate terminal, start the React frontend:
   ```bash
   # From the frontend directory
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

Visit http://localhost:3000 in your browser to use the application.
